export const fetchYandexSuggestions = async (query: string): Promise<string[]> => {
  if (!query) return [];

  try {
    const res = await fetch(`/api/yandex-suggest?text=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (!data.results) {
      console.warn("⚠️ Нет results в ответе:", data);
      return [];
    }

    return data.results.map((item: any) => item.title.text);
  } catch (err) {
    console.error("🔥 Ошибка запроса к backend-прокси:", err);
    return [];
  }
};
