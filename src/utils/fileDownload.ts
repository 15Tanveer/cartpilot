/**
 * Triggers a file download in the browser
 * @param url - The URL or data URL of the file to download
 * @param fileName - The name to give the downloaded file
 */
export const downloadFile = (url: string, fileName: string): void => {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
