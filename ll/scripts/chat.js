class ChatManager {
    constructor() {
        this.chatContainer = document.querySelector('.chat-container');
        this.messagesContainer = document.querySelector('.chat-messages');
        this.chatInput = document.getElementById('chatInput');
        this.sendButton = document.querySelector('.send-btn');
        this.historyBtn = document.querySelector('.control-btn:nth-child(2)');
        this.backBtn = document.querySelector('.back-btn');
        this.historyContent = document.querySelector('.history-content');
        this.emojiBtn = document.querySelector('.emoji-btn');
        
        this.apiService = new APIService();
        this.conversationHistory = [];
        this.currentSessionId = null;
        
        this.historyBtn.addEventListener('click', () => {
            console.log('历史记录按钮被点击');
            document.querySelectorAll('.control-btn').forEach(b => b.classList.remove('active'));
            this.historyBtn.classList.add('active');
            this.showHistoryDialog();
        });
        
        this.backBtn.addEventListener('click', () => {
            console.log('返回按钮被点击');
            this.chatContainer.classList.remove('show-history');
            this.historyBtn.classList.remove('active');
            document.querySelector('.control-btn:first-child').classList.add('active');
        });
        
        this.initializeEventListeners();
        this.initializeEmojiPicker();
        
        this.loadConversations();
        
        this.chatInput.focus();
    }

    initializeEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.chatInput.addEventListener('input', () => {
            this.chatInput.style.height = 'auto';
            this.chatInput.style.height = this.chatInput.scrollHeight + 'px';
        });

        document.querySelector('.control-btn:first-child').addEventListener('click', () => {
            document.querySelectorAll('.control-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('.control-btn:first-child').classList.add('active');
            this.startNewConversation();
        });

        document.addEventListener('click', (e) => {
            const container = document.querySelector('.chat-container');
            const historyPanel = document.querySelector('.history-panel');
            const historyBtn = document.querySelector('.control-btn:not(.active)');
            
            if (container.classList.contains('show-history') && 
                !historyPanel.contains(e.target) && 
                !historyBtn.contains(e.target)) {
                container.classList.remove('show-history');
            }
        });
    }

    initializeEmojiPicker() {
        const emojiPanel = document.createElement('div');
        emojiPanel.className = 'emoji-panel';
        
        const emojis = [
            '😊', '😂', '🤣', '😍', '🥰', '😘', '😅', 
            '😉', '🤔', '🤗', '😐', '😶', '😏', '😮',
            '😭', '😢', '😤', '😠', '😡', '🤮', '🤧',
            '😷', '🤒', '🤕', '😴', '🥱', '😪', '😇',
            '🤠', '🤡', '🥳', '😎', '🤓', '🧐', '🤥',
            '👍', '👎', '👌', '🤝', '🙏', '💪', '🤲',
            '❤️', '💔', '💯', '💢', '💫', '💦', '💨'
        ];
        
        emojis.forEach(emoji => {
            const span = document.createElement('span');
            span.textContent = emoji;
            span.addEventListener('click', () => {
                const start = this.chatInput.selectionStart;
                const end = this.chatInput.selectionEnd;
                const text = this.chatInput.value;
                this.chatInput.value = text.substring(0, start) + emoji + text.substring(end);
                this.chatInput.selectionStart = this.chatInput.selectionEnd = start + emoji.length;
                emojiPanel.style.display = 'none';
                this.chatInput.focus();
            });
            emojiPanel.appendChild(span);
        });
        
        document.querySelector('.utility-buttons').appendChild(emojiPanel);
        
        this.emojiBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = emojiPanel.style.display === 'grid';
            emojiPanel.style.display = isVisible ? 'none' : 'grid';
        });
        
        document.addEventListener('click', (e) => {
            if (!emojiPanel.contains(e.target) && e.target !== this.emojiBtn) {
                emojiPanel.style.display = 'none';
            }
        });
    }

    showChat() {
        this.heroSection.style.display = 'none';
        this.chatSection.style.display = 'block';
        this.chatInput.focus();
    }

    startNewConversation() {
        this.currentSessionId = Date.now().toString();
        this.conversationHistory = [];
        this.messagesContainer.innerHTML = '';
        this.addMessage('你好！我是你的AI助手，有什么我可以帮你的吗？', 'ai');
        this.saveCurrentConversation();
    }

    saveCurrentConversation() {
        if (!this.currentSessionId) return;

        const conversations = this.loadConversationsFromStorage();
        conversations[this.currentSessionId] = {
            timestamp: Date.now(),
            history: this.conversationHistory,
            preview: this.conversationHistory.length > 0 
                ? this.conversationHistory[this.conversationHistory.length - 1].content.slice(0, 50) + '...'
                : '新对话'
        };

        localStorage.setItem('chatConversations', JSON.stringify(conversations));
    }

    loadConversationsFromStorage() {
        const saved = localStorage.getItem('chatConversations');
        return saved ? JSON.parse(saved) : {};
    }

    loadConversation(sessionId) {
        const conversations = this.loadConversationsFromStorage();
        const conversation = conversations[sessionId];
        
        if (conversation) {
            this.currentSessionId = sessionId;
            this.conversationHistory = conversation.history;
            this.messagesContainer.innerHTML = '';
            
            this.conversationHistory.forEach(msg => {
                this.addMessage(msg.content, msg.role === 'user' ? 'user' : 'ai', false);
            });
        }
    }

    showHistoryDialog() {
        console.log('显示历史记录对话框');
        this.chatContainer.classList.add('show-history');
        
        this.historyContent.innerHTML = '';
        
        const conversations = this.loadConversationsFromStorage();
        
        if (Object.keys(conversations).length === 0) {
            this.historyContent.innerHTML = '<div class="no-history">暂时没有历史记录</div>';
            return;
        }
        
        Object.entries(conversations)
            .sort(([,a], [,b]) => b.timestamp - a.timestamp)
            .forEach(([sessionId, data]) => {
                const item = document.createElement('div');
                item.className = 'history-item';
                item.innerHTML = `
                    <div class="preview">${data.preview}</div>
                    <div class="time">${new Date(data.timestamp).toLocaleString()}</div>
                `;
                
                item.addEventListener('click', () => {
                    this.loadConversation(sessionId);
                    this.chatContainer.classList.remove('show-history');
                    this.historyBtn.classList.remove('active');
                    document.querySelector('.control-btn:first-child').classList.add('active');
                });
                
                this.historyContent.appendChild(item);
            });
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;

        this.addMessage(message, 'user');
        this.conversationHistory.push({ role: 'user', content: message });
        this.chatInput.value = '';
        this.chatInput.style.height = 'auto';

        this.showTypingIndicator();

        try {
            let aiMessage = '';
            const aiMessageElement = document.createElement('div');
            aiMessageElement.className = 'message ai';
            aiMessageElement.innerHTML = `
                <div class="avatar">AI</div>
                <div class="message-content">
                    <p></p>
                </div>
            `;
            
            this.removeTypingIndicator();
            this.messagesContainer.appendChild(aiMessageElement);
            
            const response = await this.apiService.sendMessage(
                message, 
                this.conversationHistory,
                (chunk) => {
                    aiMessage += chunk;
                    aiMessageElement.querySelector('p').textContent = aiMessage;
                    this.scrollToBottom();
                }
            );

            this.conversationHistory.push({ role: 'assistant', content: aiMessage });
            this.saveCurrentConversation();
            
        } catch (error) {
            console.error('发送消息失败:', error);
            this.removeTypingIndicator();
            this.addMessage('抱歉，发生了一些错误，请稍后重试。', 'ai');
        }
    }

    addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.textContent = type === 'ai' ? 'AI' : '我';

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.innerHTML = `<p>${this.formatMessage(content)}</p>`;

        if (type === 'user') {
            messageDiv.appendChild(messageContent);
            messageDiv.appendChild(avatar);
        } else {
            messageDiv.appendChild(avatar);
            messageDiv.appendChild(messageContent);
        }

        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    formatMessage(message) {
        return message.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
    }

    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message ai typing';
        typingDiv.innerHTML = `
            <div class="avatar">AI</div>
            <div class="message-content">
                <p>正在输入...</p>
            </div>
        `;
        this.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    removeTypingIndicator() {
        const typingIndicator = this.messagesContainer.querySelector('.typing');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    clearConversation() {
        this.conversationHistory = [];
        this.messagesContainer.innerHTML = '';
        this.addMessage('你好！我是你的AI助手，有什么我可以帮你的吗？', 'ai');
    }
} 