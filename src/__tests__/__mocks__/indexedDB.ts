// IndexedDB Mock
export const clearAllChatMessages = jest.fn().mockResolvedValue(undefined);
export const saveChatMessage = jest.fn().mockResolvedValue(undefined);
export const getChatMessages = jest.fn().mockResolvedValue([]);
