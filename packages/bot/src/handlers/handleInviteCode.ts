import { BotContext } from "../types/context";
import UserModel from "../models/User";
import { UserSessionStore } from "../services/UserSessionStore";

export const handleInviteCode = async (ctx: BotContext): Promise<void> => {
  if (!ctx.message || !("text" in ctx.message)) return;

  const inviteCode = ctx.message.text.trim();
  const tgUser = ctx.from;
  if (!tgUser) {
    console.warn("⛔️ Нет tgUser в контексте");
    return;
  }

  const telegramId = tgUser.id;
  console.log(`📨 Ввод инвайт-кода от Telegram ID: ${telegramId}`);

  const fsm = await UserSessionStore.getStateByTelegramId(telegramId);
  if (!fsm || fsm.state !== "awaiting_invite_code") {
    console.log("⏭ Состояние FSM отсутствует или не соответствует 'awaiting_invite_code'");
    return;
  }

  const user = await UserModel.findOne({ inviteCode });
  if (!user) {
    console.log(`❌ Инвайт-код не найден: ${inviteCode}`);
    await ctx.reply("❌ Неверный код приглашения. Попробуйте ещё раз.");
    return;
  }

  // Обновление данных пользователя
  user.telegramId = telegramId;
  user.fullName = `${tgUser.first_name ?? ""} ${tgUser.last_name ?? ""}`.trim();
  user.username = tgUser.username ?? "";
  user.photoUrl = "";
  user.onboardingCompleted = false;
  user.status = "active";

  await user.save();
  console.log(`✅ Пользователь привязан к Telegram: ${user.fullName} (${user._id})`);

  // Устанавливаем состояние authorized по userId
  await UserSessionStore.setState(user._id, "authorized");
  ctx.user = user;

  await ctx.reply(`✅ Готово! Вы присоединились к компании.`);
};
