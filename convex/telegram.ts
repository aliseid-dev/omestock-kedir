import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

const DEFAULT_BOT_TOKEN = "8862271033:AAHoUK5i_r_DaYxHKUMlEyXHvOaTtmGOt-Q";
const DEFAULT_CHAT_ID = "5069830125";
const DEFAULT_SITE_URL = "https://mild-dragon-123.eu-west-1.convex.site";

// Action to check bot information (username, name)
export const getTelegramBotInfo = action({
  args: {
    botToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const token = args.botToken || process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN;
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  },
});

// Action to send a pending approval request notification to Telegram
export const sendApprovalNotification = action({
  args: {
    requestId: v.id("approvalRequests"),
    botToken: v.optional(v.string()),
    chatId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return { success: true };
  },
});

// Full action to dispatch Telegram approval message with inline buttons to all registered owners
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

    // Automatically ensure webhook is active on Telegram
    try {
      const siteUrl = process.env.CONVEX_SITE_URL || DEFAULT_SITE_URL;
      const targetWebhook = `${siteUrl.replace(/\/$/, "")}/telegram-webhook`;
      const webhookCheck = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
      const webhookData = await webhookCheck.json();
      if (!webhookData.ok || webhookData.result?.url !== targetWebhook) {
        await fetch(
          `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(targetWebhook)}`
        );
      }
    } catch (whErr) {
      console.warn("Auto-webhook check warning:", whErr);
    }

    // Collect all recipient chat IDs (auto-registered subscribers + fallback)
    const recipientChatIds = new Set<string>();

    try {
      const subscribers = await ctx.runQuery(api.approvals.getActiveTelegramSubscribers);
      if (Array.isArray(subscribers)) {
        subscribers.forEach((s: any) => {
          if (s.chatId) recipientChatIds.add(String(s.chatId));
        });
      }
    } catch (subErr) {
      console.warn("Failed to query subscribers:", subErr);
    }

    if (args.chatId) recipientChatIds.add(String(args.chatId));
    if (process.env.TELEGRAM_OWNER_CHAT_ID) recipientChatIds.add(String(process.env.TELEGRAM_OWNER_CHAT_ID));
    if (DEFAULT_CHAT_ID) recipientChatIds.add(DEFAULT_CHAT_ID);

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

    let firstMessageId: number | null = null;
    let anySuccess = false;
    let lastError: string | null = null;

    for (const targetChatId of recipientChatIds) {
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
          anySuccess = true;
          if (!firstMessageId) {
            firstMessageId = data.result.message_id;
            await ctx.runMutation(api.approvals.setTelegramMessageInfo, {
              requestId: args.requestId,
              messageId: data.result.message_id,
              chatId: String(targetChatId),
            });
          }
        } else {
          lastError = data.description || "Telegram API rejected message";
          console.warn(`Failed to send to Telegram chat ${targetChatId}:`, data);
        }
      } catch (err: any) {
        lastError = err.message;
        console.error(`Error sending Telegram to ${targetChatId}:`, err);
      }
    }

    return {
      success: anySuccess,
      messageId: firstMessageId,
      recipientsCount: recipientChatIds.size,
      error: anySuccess ? null : lastError,
    };
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
    const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const statusBadge =
      args.status === "approved"
        ? `\n\n━━━━━━━━━━━━━━━━━━━━\n✅ <b>APPROVED by ${args.reviewerName} at ${nowStr}</b>\n<i>Stock has been updated automatically.</i>`
        : `\n\n━━━━━━━━━━━━━━━━━━━━\n❌ <b>REJECTED by ${args.reviewerName} at ${nowStr}</b>\n<i>No stock changes were applied.</i>`;

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

// Action to set or ensure the Telegram webhook URL
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

export const ensureTelegramWebhook = action({
  args: {
    siteUrl: v.optional(v.string()),
    botToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const token = args.botToken || process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN;
    const siteUrl = args.siteUrl || process.env.CONVEX_SITE_URL || DEFAULT_SITE_URL;
    const webhookUrl = `${siteUrl.replace(/\/$/, "")}/telegram-webhook`;

    try {
      const checkRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
      const checkData = await checkRes.json();
      if (checkData.ok && checkData.result?.url === webhookUrl) {
        return { success: true, url: webhookUrl, alreadyActive: true };
      }

      const res = await fetch(
        `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`
      );
      const data = await res.json();
      return { success: data.ok, url: webhookUrl, result: data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
});

