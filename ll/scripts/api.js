class APIService {
    constructor() {
        this.baseUrl = 'https://api.moonshot.cn/v1';
        this.apiKey = 'sk-K2phZGUxNmQ0YjJkNDRkMWE5YmM5ZDQ3NmUyNGQ3OWIyMmViZmVlNjI1NzAzNDVh';
    }

    async sendMessage(message, history, onChunk) {
        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'moonshot-v1-8k',
                    messages: [
                        ...history.map(msg => ({
                            role: msg.role,
                            content: msg.content
                        })),
                        {
                            role: 'user',
                            content: message
                        }
                    ],
                    stream: true
                })
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            // 处理流式响应
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value);
                // 解析服务器返回的数据
                try {
                    const lines = chunk
                        .split('\n')
                        .filter(line => line.trim() !== '' && line.trim() !== 'data: [DONE]');
                    
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = JSON.parse(line.slice(6));
                            if (data.choices && data.choices[0].delta.content) {
                                onChunk(data.choices[0].delta.content);
                            }
                        }
                    }
                } catch (e) {
                    console.error('Error parsing chunk:', e);
                }
            }

        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
} 