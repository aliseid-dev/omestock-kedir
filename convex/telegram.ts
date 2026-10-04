import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

const DEFAULT_BOT_TOKEN = "8862271033:AAHoUK5i_r_DaYxHKUMlEyXHvOaTtmGOt-Q";
const DEFAULT_CHAT_ID = "5069830125";

// Action to send a pending approval request notification to Telegram
export const sendApprovalNotification = action({
  args: {
    requestId: v.id("approvalRequests"),
    botToken: v.optional(v.string()),
    chatId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const token = args.botToken || process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN;
    const targetChatId = args.chatId || process.env.TELEGRAM_OWNER_CHAT_ID || DEFAULT_CHAT_ID;

    // Fetch the approval request record using runQuery
    const requests = await ctx.runQuery(api.approvals.getAllApprovals, {
      clientId: "" as any,
    }).catch(() => null);

    // Alternative: fetch request details passed or via query
    // Let's create an action that receives the formatted notification payload directly
    return { success: true };
  },
});

// Full action to dispatch Telegram approval message with inline buttons
export const dispatchTelegramApproval = action({
  args: {
    requestId: v.id("approvalRequests"),
    type: v.string(), // "transfer" | "direct_purchase"
    requestedByName: v.string(),
    sourceName: v.optional(v.string()),
    destinationName: v.optional(v.string()),
    itemsSummary: v.string(), // e.g. "12 KG GAS nok (x10), FLANja (x5)"
    totalCost: v.optional(v.number()),
    paymentMethod: v.optional(v.string()),
    supplierName: v.optional(v.string()),
    notes: v.optional(v.string()),
    botToken: v.optional(v.string()),
    chatId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const token = args.botToken || process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN;
    const targetChatId = args.chatId || process.env.TELEGRAM_OWNER_CHAT_ID || DEFAULT_CHAT_ID;

    const isTransfer = args.type === "transfer";
    const title = isTransfer
      ? "📦 <b>NEW STOCK TRANSFER REQUEST</b>"
      : "🛒 <b>NEW DIRECT PURCHASE REQUEST</b>";

    let message = `${title}\n\n`;
    message += `👤 <b>Requested By:</b> ${args.requestedByName}\n`;
    
    if (isTransfer) {
      message += `📤 <b>From:</b> ${args.sourceName || "Warehouse"}\n`;
      message += `📥 <b>To:</b> ${args.destinationName || "Store"}\n`;
    } else {
      message += `📥 <b>Destination:</b> ${args.destinationName || "Store"}\n`;
      if (args.supplierName) {
        message += `🏢 <b>Supplier:</b> ${args.supplierName}\n`;
      }
      if (args.paymentMethod) {
        message += `💳 <b>Payment:</b> ${args.paymentMethod}\n`;
      }
      if (args.totalCost !== undefined && args.totalCost > 0) {
        message += `💰 <b>Total Amount:</b> ${args.totalCost.toLocaleString()} ETB\n`;
      }
    }

    message += `\n📋 <b>Items:</b>\n${args.itemsSummary}\n`;

    if (args.notes) {
      message += `\n📝 <b>Notes:</b> <i>${args.notes}</i>\n`;
    }

    message += `\n⏰ <i>Sent at ${new Date().toLocaleTimeString()}</i>\n`;
    message += `\n👉 <b>Please review and choose an action below:</b>`;

    const inlineKeyboard = {
      inline_keyboard: [
        [
          {
            text: "✅ Approve",
            callback_data: `approve:${args.requestId}`,
          },
          {
            text: "❌ Reject",
            callback_data: `reject:${args.requestId}`,
          },
        ],
      ],
    };

    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: targetChatId,
          text: message,
          parse_mode: "HTML",
          reply_markup: inlineKeyboard,
        }),
      });

      const data = await res.json();
      if (data.ok && data.result?.message_id) {
        await ctx.runMutation(api.approvals.setTelegramMessageInfo, {
          requestId: args.requestId,
          messageId: data.result.message_id,
          chatId: String(targetChatId),
        });
        return { success: true, messageId: data.result.message_id };
      } else {
        console.error("Telegram API Error:", data);
        return { success: false, error: data.description };
      }
    } catch (err: any) {
      console.error("Failed to send Telegram message:", err);
      return { success: false, error: err.message };
    }
  },
});

// Update Telegram message after approval or rejection
export const updateTelegramApprovalMessage = action({
  args: {
    messageId: v.number(),
    chatId: v.string(),
    originalText: v.string(),
    status: v.union(v.literal("approved"), v.literal("rejected")),
    reviewerName: v.string(),
    botToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const token = args.botToken || process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN;
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const statusBadge =
      args.status === "approved"
        ? `\n\n━━━━━━━━━━━━━━━━━━━━\n✅ <b>APPROVED by ${args.reviewerName} at ${nowStr}</b>\n<i>Stock has been updated automatically.</i>`
        : `\n\n━━━━━━━━━━━━━━━━━━━━\n❌ <b>REJECTED by ${args.reviewerName} at ${nowStr}</b>\n<i>No stock changes were applied.</i>`;

    // Remove old "Please review" prompt and append result
    let cleanedText = args.originalText.replace(/👉 <b>Please review and choose an action below:<\/b>/g, "");
    cleanedText += statusBadge;

    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: args.chatId,
          message_id: args.messageId,
          text: cleanedText,
          parse_mode: "HTML",
          // Empty reply_markup removes the buttons
          reply_markup: { inline_keyboard: [] },
        }),
      });
      const data = await res.json();
      return { success: data.ok };
    } catch (err) {
      console.error("Failed to edit Telegram message:", err);
      return { success: false };
    }
  },
});

// Action to set the Telegram webhook URL
export const setTelegramWebhook = action({
  args: {
    webhookUrl: v.string(),
    botToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const token = args.botToken || process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN;
    const res = await fetch(
      `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(args.webhookUrl)}`
    );
    const data = await res.json();
    return data;
  },
});
