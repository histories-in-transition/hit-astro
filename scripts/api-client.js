export async function getData(baseUrl, fileName) {
  const fullUrl = baseUrl + fileName;
  const response = await fetch(fullUrl);
  if (!response.ok) {
    throw new Error("API issues " + response.statusText + "\n" + fullUrl);
  }
  const data = await response.json();
  return data;
}
