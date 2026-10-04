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

      // Handle Callback Query (Button Press: Approve / Reject)
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
        const chatId = String(message.chat?.id || "");

        // Expected format: "approve:<requestId>" or "reject:<requestId>"
        const [actionType, requestId] = data.split(":");

        if (requestId && (actionType === "approve" || actionType === "reject")) {
          try {
            if (actionType === "approve") {
              await ctx.runMutation(api.approvals.approveRequest, {
                requestId: requestId as any,
                reviewerUserId: reviewerId,
                reviewerUserName: reviewerName,
              });

              // Answer callback query with success popup
              await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  callback_query_id: callbackId,
                  text: "✅ Approved! Stock has been updated in OMESTOCK.",
                  show_alert: false,
                }),
              });

              // Update message in Telegram to reflect approved state
              const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              const currentText = message.text || "";
              const updatedText =
                currentText.replace(/👉 Please review and choose an action below:/g, "") +
                `\n\n━━━━━━━━━━━━━━━━━━━━\n✅ APPROVED by ${reviewerName} at ${nowTime}\nStock has been updated automatically.`;

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
            } else if (actionType === "reject") {
              await ctx.runMutation(api.approvals.rejectRequest, {
                requestId: requestId as any,
                reviewerUserId: reviewerId,
                reviewerUserName: reviewerName,
                reason: "Rejected via Telegram",
              });

              // Answer callback query
              await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  callback_query_id: callbackId,
                  text: "❌ Request rejected. No stock changes applied.",
                  show_alert: false,
                }),
              });

              // Update message in Telegram to reflect rejected state
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
            }
          } catch (actionErr: any) {
            console.error("Error processing approval action:", actionErr);
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
      } else if (update.message) {
        // Plain text message / /start command
        const msg = update.message;
        const chatId = msg.chat?.id;
        const text = (msg.text || "").trim();

        if (text === "/start" || text.startsWith("/start")) {
          await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: `👋 <b>Welcome to OMESTOCK Approval Bot!</b>\n\nYour Telegram Chat ID is: <code>${chatId}</code>\n\nYou will receive real-time notifications here whenever staff requests a stock transfer or records a direct purchase, with 1-click Approve and Reject buttons.`,
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
