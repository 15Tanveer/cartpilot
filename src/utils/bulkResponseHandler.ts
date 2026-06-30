import { message } from "antd";

interface BulkResponseHandlerResult {
  shouldContinue: boolean;
  successCount?: number;
  failureCount?: number;
}

export interface IApiResponse {
  uniqueColumnValue: string;
  isSuccess: boolean;
  errorMessage: string;
}

/**
 * Generic handler for bulk API responses with IsSuccess property
 * Displays appropriate success/error/warning messages based on response
 *
 * @param response - API response (can be array or object)
 * @param config - Configuration object with entityName for generic messages
 * @returns Object with shouldContinue flag and counts
 */
export const handleBulkResponseMessages = (
  response: IApiResponse[],
): BulkResponseHandlerResult => {
  // Check if response is an array (array of results with IsSuccess property)
  if (Array.isArray(response)) {
    const successCount = response.filter((item) => item?.isSuccess).length;
    const failureCount = response.length - successCount;

    if (successCount === response.length) {
      // All records added successfully
      message.success("All records added successfully");
      return {
        shouldContinue: true,
        successCount,
        failureCount: 0,
      };
    } else if (failureCount === response.length) {
      // All records failed
      message.error("Failed to add records");
      return {
        shouldContinue: false,
        successCount: 0,
        failureCount,
      };
    } else {
      // Some succeeded, some failed
      message.warning(
        `${successCount} record(s) added successfully and ${failureCount} failed`,
      );
      return {
        shouldContinue: true,
        successCount,
        failureCount,
      };
    }
  }

  return {
    shouldContinue: true,
  };
};
