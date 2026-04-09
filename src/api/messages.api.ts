import { simulateDelay } from './client';
import type { ApiResponse } from './types';
import { mockMessages } from './mock/messages.mock';
import type { Message } from '@/types';

export async function getMessages(userId: string): Promise<ApiResponse<Message[]>> {
  await simulateDelay();
  return {
    data: mockMessages.filter((m) => m.toId === userId || m.fromId === userId),
    success: true,
  };
}

export async function getMessage(id: string): Promise<ApiResponse<Message | null>> {
  await simulateDelay();
  const msg = mockMessages.find((m) => m.id === id) ?? null;
  return { data: msg, success: !!msg };
}

export async function sendMessage(data: Partial<Message>): Promise<ApiResponse<Message>> {
  await simulateDelay();
  const msg: Message = {
    id: `msg-${Date.now()}`,
    fromId: '',
    fromName: '',
    toId: '',
    subject: '',
    content: '',
    sentAt: new Date().toISOString(),
    read: false,
    ...data,
  } as Message;
  return { data: msg, success: true };
}

export async function markAsRead(id: string): Promise<ApiResponse<Message>> {
  await simulateDelay();
  const msg = mockMessages.find((m) => m.id === id);
  if (!msg)
    return { data: null as unknown as Message, success: false, message: 'Message not found' };
  return { data: { ...msg, read: true }, success: true };
}
