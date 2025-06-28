import { Context } from 'telegraf';


export function getCallbackData(ctx: Context): string | null {
  const query = ctx.callbackQuery;

  if (query && typeof (query as any).data === 'string') {
    return (query as { data: string }).data;
  }

  return null;
}
