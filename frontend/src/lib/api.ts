const API_BASE_URL = 'http://localhost:5000/api';

export interface ScheduledMessage {
  id: number;
  content: string;
  send_time: string;
  start_date: string;
  end_date?: string;
  loop_daily: boolean;
  status: string;
}

export interface MessageHistory {
  id: number;
  content: string;
  sent_time: string;
  status: string;
}

export interface SendNowRequest {
  content: string;
}

export interface ScheduleMessageRequest {
  content: string;
  send_time: string;
  start_date: string;
  end_date?: string;
  loop_daily: boolean;
}

class APIService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async sendNow(data: SendNowRequest) {
    return this.request('/send-now', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async scheduleMessage(data: ScheduleMessageRequest) {
    return this.request('/schedule', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getScheduledMessages(): Promise<ScheduledMessage[]> {
    return this.request('/messages');
  }

  async cancelMessage(id: number) {
    return this.request(`/cancel/${id}`, {
      method: 'DELETE',
    });
  }

  async getMessageHistory(): Promise<MessageHistory[]> {
    return this.request('/history');
  }
}

export const apiService = new APIService();