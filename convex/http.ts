import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

const DEFAULT_BOT_TOKEN = "8862271033:AAHoUK5i_r_DaYxHKUMlEyXHvOaTtmGOt-Q";

http.route({
  path: "/telegram-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const token = process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN;

    try {
      const update = await request.json();

      // =========================================================================
      // 1. Handle Callback Query (Inline Button Press: Approve / Reject)
      // =========================================================================
      if (update.callback_query) {
        const cq = update.callback_query;
        const callbackId = cq.id;
        const data = cq.data || "";
        const from = cq.from || {};
        const reviewerName =
          [from.first_name, from.last_name].filter(Boolean).join(" ") ||
          from.username ||
          "Owner (Telegram)";
        const reviewerId = String(from.id || "telegram_owner");
        const message = cq.message || {};
        const messageId = message.message_id;
        const chatId = String(message.chat?.id || from.id || "");

        // Auto-register / update this user as an active approver
        if (chatId) {
          try {
            await ctx.runMutation(api.approvals.registerTelegramSubscriber, {
              chatId,
              firstName: from.first_name,
              lastName: from.last_name,
              username: from.username,
            });
          } catch (e) {
            console.warn("Failed to register subscriber from callback:", e);
          }
        }

        // Expected format: "approve:<requestId>" or "reject:<requestId>"
        const [actionType, requestId] = data.split(":");

        if (requestId && (actionType === "approve" || actionType === "reject")) {
          try {
            const req = await ctx.runQuery(api.approvals.getApprovalRequestById, {
              requestId: requestId as any,
            });

            if (!req) {
              await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  callback_query_id: callbackId,
                  text: "⚠️ Request not found or has been deleted.",
                  show_alert: true,
                }),
              });
              return new Response(JSON.stringify({ ok: true }), { status: 200 });
            }

            if (req.status !== "pending") {
              await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  callback_query_id: callbackId,
                  text: `ℹ️ This request is already ${req.status}.`,
                  show_alert: true,
                }),
              });
              return new Response(JSON.stringify({ ok: true }), { status: 200 });
            }

            if (actionType === "reject") {
              // Clear any ongoing session for this chat
              if (chatId) {
                await ctx.runMutation(api.approvals.clearTelegramSession, { chatId });
              }

              await ctx.runMutation(api.approvals.rejectRequest, {
                requestId: requestId as any,
                reviewerUserId: reviewerId,
                reviewerUserName: reviewerName,
                reason: "Rejected via Telegram",
              });

              await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  callback_query_id: callbackId,
                  text: "❌ Request rejected. No stock changes applied.",
                  show_alert: false,
                }),
              });

              const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              const currentText = message.text || "";
              const updatedText =
                currentText.replace(/👉 Please review and choose an action below:/g, "") +
                `\n\n━━━━━━━━━━━━━━━━━━━━\n❌ REJECTED by ${reviewerName} at ${nowTime}\nNo stock changes were applied.`;

              await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: chatId,
                  message_id: messageId,
                  text: updatedText,
                  reply_markup: { inline_keyboard: [] },
                }),
              });
            } else if (actionType === "approve") {
              if (req.type === "transfer") {
                // Stock transfers are approved immediately with 1 tap (no retail selling price configuration needed)
                await ctx.runMutation(api.approvals.approveRequest, {
                  requestId: requestId as any,
                  reviewerUserId: reviewerId,
                  reviewerUserName: reviewerName,
                });

                await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    callback_query_id: callbackId,
                    text: "✅ Transfer approved! Stock updated in OMESTOCK.",
                    show_alert: false,
                  }),
                });

                const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                const currentText = message.text || "";
                const updatedText =
                  currentText.replace(/👉 Please review and choose an action below:/g, "") +
                  `\n\n━━━━━━━━━━━━━━━━━━━━\n✅ APPROVED by ${reviewerName} at ${nowTime}\nStock has been transferred automatically.`;

                await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    chat_id: chatId,
                    message_id: messageId,
                    text: updatedText,
                    reply_markup: { inline_keyboard: [] },
                  }),
                });
              } else {
                // Direct purchase: initiate 2-step setup (Step 1: Min Stock Alert -> Step 2: Selling Price)
                await ctx.runMutation(api.approvals.setTelegramSession, {
                  chatId,
                  requestId: requestId as any,
                  step: "awaiting_min_alert",
                  originalMessageId: messageId,
                });

                await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    callback_query_id: callbackId,
                    text: "Step 1 of 2: Set Minimum Stock Alert",
                    show_alert: false,
                  }),
                });

                const itemNames = (req.items || [])
                  .map((it: any) => `${it.productName} (${it.quantity} ${it.unit || "units"})`)
                  .join(", ");
                const defaultMinAlert = req.items?.[0]?.minStockThreshold || 5;

                const step1Text =
                  `Please set the <b>Minimum Stock Alert</b> threshold (in units)?\n` +
                  `<i>(When stock drops to or below this level, you will receive a low-stock alert)</i>\n\n` +
                  `👉 <b>Reply with a number</b> (e.g. <code>${defaultMinAlert}</code> or <code>10</code>), or send <code>/skip</code> for default (${defaultMinAlert} units).\n` +
                  `<i>(Send /cancel to abort approval)</i>`;

                await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    chat_id: chatId,
                    text: step1Text,
                    parse_mode: "HTML",
                    reply_markup: {
                      force_reply: true,
                      input_field_placeholder: `e.g. ${defaultMinAlert}`,
                    },
                  }),
                });
              }
            }
          } catch (actionErr: any) {
            console.error("Error processing approval callback:", actionErr);
            await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                callback_query_id: callbackId,
                text: `⚠️ Notice: ${actionErr.message || "Action could not be completed"}`,
                show_alert: true,
              }),
            });
          }
        }
      }

      // =========================================================================
      // 2. Handle Text Messages & Multi-step Interactive Answers
      // =========================================================================
      else if (update.message) {
        const msg = update.message;
        const chatId = String(msg.chat?.id || "");
        const from = msg.from || {};
        const text = (msg.text || "").trim();
        const firstName = from.first_name || "";
        const lastName = from.last_name || "";
        const username = from.username || "";
        const reviewerName =
          [firstName, lastName].filter(Boolean).join(" ") || username || "Owner (Telegram)";
        const reviewerId = String(from.id || "telegram_owner");

        // Automatically register / update the sender as an active approver
        if (chatId) {
          try {
            await ctx.runMutation(api.approvals.registerTelegramSubscriber, {
              chatId,
              firstName,
              lastName,
              username,
            });
          } catch (regErr) {
            console.error("Failed to auto-register subscriber:", regErr);
          }
        }

        // Check if there is an active conversational session for this chat
        const session = await ctx.runQuery(api.approvals.getTelegramSession, { chatId });

        if (session) {
          // Check for cancellation
          if (text.toLowerCase() === "/cancel") {
            await ctx.runMutation(api.approvals.clearTelegramSession, { chatId });
            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: chatId,
                text: "❌ <b>Approval aborted.</b> The request remains pending.",
                parse_mode: "HTML",
              }),
            });
            return new Response(JSON.stringify({ ok: true }), { status: 200 });
          }

          // Fetch the associated approval request
          const req = await ctx.runQuery(api.approvals.getApprovalRequestById, {
            requestId: session.requestId,
          });

          if (!req || req.status !== "pending") {
            await ctx.runMutation(api.approvals.clearTelegramSession, { chatId });
            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: chatId,
                text: "⚠️ Request is no longer pending or was not found.",
                parse_mode: "HTML",
              }),
            });
            return new Response(JSON.stringify({ ok: true }), { status: 200 });
          }

          // ---------------------------------------------------------------------
          // Step 1: User replied with Minimum Stock Alert
          // ---------------------------------------------------------------------
          if (session.step === "awaiting_min_alert") {
            let minAlert = 5;
            const defaultMin = req.items?.[0]?.minStockThreshold || 5;

            if (text.toLowerCase() === "/skip") {
              minAlert = defaultMin;
            } else {
              const cleaned = text.replace(/[^0-9]/g, "");
              const parsed = parseInt(cleaned, 10);
              if (isNaN(parsed) || parsed < 0) {
                await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    chat_id: chatId,
                    text: `⚠️ <b>Invalid number.</b>\n\nPlease reply with a valid number for the <b>Minimum Stock Alert</b> (e.g. <code>${defaultMin}</code> or <code>10</code>), or send <code>/skip</code>:`,
                    parse_mode: "HTML",
                    reply_markup: {
                      force_reply: true,
                      input_field_placeholder: `e.g. ${defaultMin}`,
                    },
                  }),
                });
                return new Response(JSON.stringify({ ok: true }), { status: 200 });
              }
              minAlert = parsed;
            }

            // Advance session to Step 2
            await ctx.runMutation(api.approvals.setTelegramSession, {
              chatId,
              requestId: session.requestId,
              step: "awaiting_selling_price",
              minStockThreshold: minAlert,
              originalMessageId: session.originalMessageId,
            });

            // Calculate suggested/default selling price
            const firstItem = req.items?.[0];
            const itemCost =
              firstItem?.costPerUnit ||
              (req.totalCost && firstItem?.quantity ? Math.round(req.totalCost / firstItem.quantity) : 0);
            const suggestedPrice =
              firstItem?.sellingPrice || (itemCost > 0 ? Math.round(itemCost * 1.25) : 100);

            const itemNames = (req.items || [])
              .map((it: any) => `${it.productName} (${it.quantity} ${it.unit || "units"})`)
              .join(", ");

            const step2Text =
              `🔔 <b>Min Stock Alert Set:</b> <b>${minAlert} units</b> ✅\n\n` +
              `Now set <b>Retail Selling Price</b> (in ETB):\n` +
              `<i>(This is the price customers will pay in the store)</i>\n\n` +
              `👉 <b>Reply with the price</b> \n` +
              `<i>(Send /cancel to abort approval)</i>`;

            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: chatId,
                text: step2Text,
                parse_mode: "HTML",
                reply_markup: {
                  force_reply: true,
                  input_field_placeholder: `e.g. ${suggestedPrice}`,
                },
              }),
            });

            return new Response(JSON.stringify({ ok: true }), { status: 200 });
          }

          // ---------------------------------------------------------------------
          // Step 2: User replied with Retail Selling Price
          // ---------------------------------------------------------------------
          else if (session.step === "awaiting_selling_price") {
            const firstItem = req.items?.[0];
            const itemCost =
              firstItem?.costPerUnit ||
              (req.totalCost && firstItem?.quantity ? Math.round(req.totalCost / firstItem.quantity) : 0);
            const suggestedPrice =
              firstItem?.sellingPrice || (itemCost > 0 ? Math.round(itemCost * 1.25) : 100);

            let sellingPrice = suggestedPrice;
            if (text.toLowerCase() === "/skip") {
              sellingPrice = suggestedPrice;
            } else {
              const cleaned = text.replace(/,/g, "").replace(/[^0-9.]/g, "");
              const parsed = parseFloat(cleaned);
              if (isNaN(parsed) || parsed <= 0) {
                await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    chat_id: chatId,
                    text: `⚠️ <b>Invalid price.</b>\n\nPlease reply with a valid <b>Retail Selling Price</b> in ETB (e.g. <code>${suggestedPrice}</code>), or send <code>/skip</code>:`,
                    parse_mode: "HTML",
                    reply_markup: {
                      force_reply: true,
                      input_field_placeholder: `e.g. ${suggestedPrice}`,
                    },
                  }),
                });
                return new Response(JSON.stringify({ ok: true }), { status: 200 });
              }
              sellingPrice = parsed;
            }

            const minStockThreshold = session.minStockThreshold || 5;

            // Build product configs for all items
            const productConfigs = (req.items || []).map((it: any) => ({
              productId: it.productId,
              sellingPrice: sellingPrice,
              minStockThreshold: minStockThreshold,
              costPrice: it.costPerUnit || (itemCost > 0 ? itemCost : undefined),
              unit: it.unit || "Piece",
            }));

            // Execute atomic approval and update inventory & catalog
            await ctx.runMutation(api.approvals.approveRequest, {
              requestId: session.requestId,
              reviewerUserId: reviewerId,
              reviewerUserName: reviewerName,
              productConfigs,
            });

            // Clear session
            await ctx.runMutation(api.approvals.clearTelegramSession, { chatId });

            // Update original request notification message if present
            if (session.originalMessageId) {
              try {
                const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                const itemNames = (req.items || []).map((i: any) => i.productName).join(", ");
                await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    chat_id: chatId,
                    message_id: session.originalMessageId,
                    text:
                      `🛒 <b>DIRECT PURCHASE REQUEST — APPROVED ✅</b>\n\n` +
                      `👤 <b>Requested By:</b> ${req.requestedByUserName}\n` +
                      `📥 <b>Destination:</b> ${req.destinationLocationName || "Store"}\n` +
                      (req.supplierName ? `🏢 <b>Supplier:</b> ${req.supplierName}\n` : "") +
                      `📦 <b>Product:</b> ${itemNames}\n` +
                      `🏷 <b>Selling Price:</b> <b>${sellingPrice.toLocaleString()} ETB</b>\n` +
                      `🔔 <b>Min Stock Alert:</b> <b>${minStockThreshold} units</b>\n\n` +
                      `━━━━━━━━━━━━━━━━━━━━\n` +
                      `✅ <b>APPROVED by ${reviewerName} at ${nowTime}</b>\n` +
                      `<i>Stock received and product catalog updated automatically.</i>`,
                    parse_mode: "HTML",
                    reply_markup: { inline_keyboard: [] },
                  }),
                });
              } catch (editErr) {
                console.warn("Failed to edit original Telegram message:", editErr);
              }
            }

            // Send confirmation message
            const itemNames = (req.items || [])
              .map((it: any) => `${it.productName} (x${it.quantity})`)
              .join(", ");

            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: chatId,
                text:
                  `🎉 <b>Direct Purchase Approved Successfully!</b>\n\n` +
                  `📦 <b>Product:</b> ${itemNames}\n` +
                  `🏷 <b>Selling Price:</b> <b>${sellingPrice.toLocaleString()} ETB</b>\n` +
                  `🔔 <b>Min Stock Alert:</b> <b>${minStockThreshold} units</b>\n` +
                  `📥 <b>Stock Location:</b> ${req.destinationLocationName || "Store"}\n\n` +
                  `✅ Stock added to inventory and pricing is live in OMESTOCK.`,
                parse_mode: "HTML",
              }),
            });

            return new Response(JSON.stringify({ ok: true }), { status: 200 });
          }
        }

        // ---------------------------------------------------------------------
        // Standard Bot Commands (/start, /pending, /requests, etc.)
        // ---------------------------------------------------------------------
        if (text === "/start" || text.startsWith("/start")) {
          await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text:
                `👋 <b>Welcome to OMESTOCK Approvals, ${firstName || "Owner"}!</b>\n\n` +
                `✅ <b>You are automatically connected.</b>\n\n` +
                `Whenever staff submits a stock transfer or purchase request, you will receive an instant notification here with <b>1-Click Approve</b> and <b>Reject</b> buttons.\n\n` +
                `⚡️ For purchase requests, approving allows you to set the <b>Minimum Stock Alert</b> and <b>Selling Price</b> right here on Telegram!\n\n` +
                `⚡️ <i>Send <b>/pending</b> anytime to review all requests waiting for your approval.</i>`,
              parse_mode: "HTML",
            }),
          });
        } else if (text === "/pending" || text === "/requests") {
          try {
            const pendingRequests = await ctx.runQuery(
              api.approvals.getPendingRequestsForTelegram
            );

            if (!pendingRequests || pendingRequests.length === 0) {
              await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: `🎉 <b>All caught up!</b>\n\nThere are no pending stock transfer or purchase requests right now.`,
                  parse_mode: "HTML",
                }),
              });
            } else {
              await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: `📋 <b>Found ${pendingRequests.length} Pending Request${pendingRequests.length > 1 ? "s" : ""}:</b>`,
                  parse_mode: "HTML",
                }),
              });

              for (const req of pendingRequests) {
                const isTransfer = req.type === "transfer";
                let reqMsg = isTransfer
                  ? `📦 <b>STOCK TRANSFER REQUEST</b>\n`
                  : `🛒 <b>DIRECT PURCHASE REQUEST</b>\n`;

                reqMsg += `👤 <b>Requested By:</b> ${req.requestedByUserName}\n`;
                if (isTransfer) {
                  reqMsg += `📤 <b>From:</b> ${req.sourceLocationName || "Warehouse"}\n`;
                  reqMsg += `📥 <b>To:</b> ${req.destinationLocationName || "Store"}\n`;
                } else {
                  reqMsg += `📥 <b>Destination:</b> ${req.destinationLocationName || "Store"}\n`;
                  if (req.supplierName) reqMsg += `🏢 <b>Supplier:</b> ${req.supplierName}\n`;
                  if (req.totalCost) reqMsg += `💰 <b>Total Cost:</b> ${req.totalCost.toLocaleString()} ETB\n`;
                }

                reqMsg += `📋 <b>Items:</b>\n`;
                for (const it of req.items) {
                  reqMsg += `• ${it.productName}: <b>${it.quantity}</b> ${it.unit || "units"}\n`;
                }

                const keyboard = {
                  inline_keyboard: [
                    [
                      {
                        text: "✅ Approve",
                        callback_data: `approve:${req._id}`,
                      },
                      {
                        text: "❌ Reject",
                        callback_data: `reject:${req._id}`,
                      },
                    ],
                  ],
                };

                await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    chat_id: chatId,
                    text: reqMsg,
                    parse_mode: "HTML",
                    reply_markup: keyboard,
                  }),
                });
              }
            }
          } catch (queryErr: any) {
            console.error("Error fetching pending requests:", queryErr);
          }
        } else {
          // General help reply
          await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text:
                `🤖 <b>OMESTOCK Approval Bot</b>\n\n` +
                `✅ <b>Status:</b> Connected & Active\n` +
                `👤 <b>Approver:</b> ${reviewerName}\n\n` +
                `You can review, accept, and reject stock transfers and direct purchases directly in Telegram.\n\n` +
                `Commands:\n` +
                `• /pending - Check requests waiting for approval\n` +
                `• /start - Refresh your connection`,
              parse_mode: "HTML",
            }),
          });
        }
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Telegram webhook handler error:", err);
      return new Response(JSON.stringify({ ok: false }), { status: 200 });
    }
  }),
});

export default http;
