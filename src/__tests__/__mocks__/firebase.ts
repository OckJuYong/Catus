// Firebase Mock
export const requestNotificationPermission = jest.fn().mockResolvedValue('mock-token');

export const onForegroundMessage = jest.fn().mockReturnValue(() => {});
