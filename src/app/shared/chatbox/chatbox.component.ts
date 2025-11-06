import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { ChatService, ChatMessage, Conversation } from '../../core/services/chat.service';
import { UserService } from '../../core/services/user.service';
import { ClassService } from '../../core/services/class.service';
import { StudentService } from '../../core/services/student.service';
import { Subscription, forkJoin } from 'rxjs';

interface UserForChat {
  id: number;
  fullName: string;
  avatar?: string;
  role: string;
}

@Component({
  selector: 'app-chatbox',
  templateUrl: './chatbox.component.html',
  styleUrls: ['./chatbox.component.css']
})
export class ChatboxComponent implements OnInit, OnDestroy {
  isOpen = false;
  isMinimized = false;
  showConversationList = true;
  currentConversation: Conversation | null = null;

  // Search
  searchText = '';
  searchResults: UserForChat[] = [];
  allUsers: UserForChat[] = [];

  messageText = '';
  conversations: Conversation[] = [];
  messages: ChatMessage[] = [];
  currentUserId: number = 0;  private subscriptions: Subscription[] = [];
  private conversationSubscription: any = null;

  constructor(
    private chatService: ChatService,
    private userService: UserService,
    private classService: ClassService,
    private studentService: StudentService
  ) {}

  ngOnInit() {
    try {
      this.currentUserId = this.chatService.getCurrentUserId();

      // Chỉ kết nối WebSocket nếu đã đăng nhập (có userId hợp lệ)
      if (!this.currentUserId || this.currentUserId === 0) {
        console.log('Chatbox: User not logged in, skipping connection');
        return;
      }

      // Connect to WebSocket
      this.chatService.connect();

      // Listen to personal messages
      this.subscriptions.push(
        this.chatService.personalMessages$.subscribe(msg => {
          if (msg) {
            this.handleIncomingMessage(msg);
          }
        })
      );

      // Load conversations
      this.loadConversations();

      // Load classmates/students based on role (for search feature)
      this.loadAllUsers();
    } catch (error) {
      console.error('Chatbox initialization error:', error);
      // Don't crash the app if chatbox fails to initialize
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.chatService.disconnect();
  }

  loadConversations() {
    this.chatService.getConversations().subscribe({
      next: (data) => {
        this.conversations = data;
      },
      error: (err) => {
        console.error('Failed to load conversations:', err);
        // Fallback to empty list
        this.conversations = [];
      }
    });
  }

  loadChatHistory(otherUserId: number) {
    this.chatService.getChatHistory(otherUserId).subscribe({
      next: (data) => {
        this.messages = data.map(msg => ({
          ...msg,
          isOwn: msg.senderId === this.currentUserId
        }));
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (err) => {
        console.error('Failed to load chat history:', err);
        this.messages = [];
      }
    });
  }

  handleIncomingMessage(msg: ChatMessage) {
    // Add isOwn flag
    const message = {
      ...msg,
      isOwn: msg.senderId === this.currentUserId
    };

    // Update conversation list
    const convIndex = this.conversations.findIndex(
      c => c.otherUserId === (msg.senderId === this.currentUserId ? msg.receiverId : msg.senderId)
    );

    if (convIndex >= 0) {
      const conv = this.conversations[convIndex];
      conv.lastMessage = msg;

      // Increment unread if not current conversation and not own message
      if (!message.isOwn && (!this.currentConversation || conv.otherUserId !== this.currentConversation.otherUserId)) {
        conv.unreadCount++;
      }

      // Move to top
      this.conversations.splice(convIndex, 1);
      this.conversations.unshift(conv);
    }

    // Add to messages if in current conversation
    if (this.currentConversation) {
      const isFromCurrentConv =
        (msg.senderId === this.currentConversation.otherUserId && msg.receiverId === this.currentUserId) ||
        (msg.receiverId === this.currentConversation.otherUserId && msg.senderId === this.currentUserId);

      if (isFromCurrentConv) {
        // Check if message already exists (avoid duplicates from echo)
        const exists = this.messages.find(m => m.id === msg.id);
        if (!exists) {
          this.messages.push(message);
          setTimeout(() => this.scrollToBottom(), 100);
        }

        // Mark as read if not own message
        if (!message.isOwn && msg.id) {
          this.chatService.markAsRead(msg.id).subscribe();
        }
      }
    }
  }

  toggleChatbox() {
    this.isOpen = !this.isOpen;
    if (!this.isOpen) {
      this.isMinimized = false;
      this.showConversationList = true;
      this.currentConversation = null;
    } else {
      // Reload conversations when opening
      this.loadConversations();
    }
  }

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
  }

  selectConversation(conversation: Conversation) {
    this.currentConversation = conversation;
    this.showConversationList = false;
    this.messages = [];

    // Load chat history
    this.loadChatHistory(conversation.otherUserId);

    // Subscribe to conversation topic
    const convId = this.chatService.getConversationId(this.currentUserId, conversation.otherUserId);
    this.chatService.subscribeToConversation(convId, (msg) => {
      this.handleIncomingMessage(msg);
    });

    // Mark as read
    conversation.unreadCount = 0;
  }

  backToConversationList() {
    this.showConversationList = true;
    this.currentConversation = null;
    this.messages = [];
  }

  sendMessage() {
    if (!this.messageText.trim() || !this.currentConversation) return;

    const content = this.messageText.trim();
    const receiverId = this.currentConversation.otherUserId;

    // Optimistic UI: add message immediately with temporary data
    const tempMessage: ChatMessage = {
      id: Date.now(), // temporary ID
      senderId: this.currentUserId,
      receiverId: receiverId,
      content: content,
      sentAt: new Date().toISOString(),
      isRead: false,
      isOwn: true
    };

    this.messages.push(tempMessage);
    this.messageText = '';

    // Send via WebSocket
    this.chatService.sendMessage(receiverId, content);

    // Update conversation last message
    if (this.currentConversation) {
      this.currentConversation.lastMessage = tempMessage;
    }

    // Scroll to bottom
    setTimeout(() => this.scrollToBottom(), 100);
  }

  scrollToBottom() {
    const messageContainer = document.querySelector('.chat-messages');
    if (messageContainer) {
      messageContainer.scrollTop = messageContainer.scrollHeight;
    }
  }

  getTimeAgo(date: string | Date): string {
    const now = new Date();
    const msgDate = typeof date === 'string' ? new Date(date) : date;
    const diffMs = now.getTime() - msgDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return msgDate.toLocaleDateString('vi-VN');
  }

  getMessageTime(date: string | Date): string {
    const msgDate = typeof date === 'string' ? new Date(date) : date;
    return msgDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }

  getInitial(name: string): string {
    return name?.charAt(0)?.toUpperCase() || 'U';
  }

  getTotalUnreadCount(): number {
    return this.conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
  }

  getSenderName(msg: ChatMessage): string {
    if (msg.senderId === this.currentUserId) {
      return 'Tôi';
    }
    return this.currentConversation?.otherUserFullName || 'User';
  }

  // New Chat functions
  onSearchChange() {
    if (!this.searchText.trim()) {
      this.searchResults = [];
      return;
    }

    const searchTerm = this.searchText.toLowerCase();

    // Load users from API if not loaded
    if (this.allUsers.length === 0) {
      this.loadAllUsers();
      return;
    }

    // Filter users
    this.searchResults = this.allUsers.filter(user =>
      user.fullName.toLowerCase().includes(searchTerm) &&
      user.id !== this.currentUserId // Exclude current user
    );

    // Also filter existing conversations
    // (conversations will be filtered by Angular in template if needed)
  }

  loadAllUsers() {
    // Get current user info to determine role
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}'); // Changed to 'user'
    const userRole = currentUser.role;

    if (userRole === 'STUDENT') {
      // For students: Get classmates (students + teachers in same classes)
      this.loadClassmates();
    } else if (userRole === 'TEACHER') {
      // For teachers: Get all students in their classes
      this.loadTeacherStudents();
    } else {
      // For others: No restrictions
      this.loadAllUsersNoFilter();
    }
  }

  loadClassmates() {
    // Get all classes of current student using correct method
    this.studentService.getClassesByStudent(this.currentUserId).subscribe({
      next: (classes: any[]) => {
        if (!classes || classes.length === 0) {
          this.allUsers = [];
          return; // ✅ Removed onSearchChange()
        }

        const classIds = classes.map(c => c.id);
        const userPromises: any[] = [];

        // Get all students and teachers from these classes using correct method
        classIds.forEach(classId => {
          userPromises.push(
            this.classService.getClass(classId).toPromise()
          );
        });

        Promise.all(userPromises).then(classDetails => {
          const uniqueUsers = new Map<number, UserForChat>();

          classDetails.forEach((classDetail: any) => {
            // Add teacher
            if (classDetail.teacher && classDetail.teacher.id !== this.currentUserId) {
              uniqueUsers.set(classDetail.teacher.id, {
                id: classDetail.teacher.id,
                fullName: classDetail.teacher.fullName || classDetail.teacher.username,
                avatar: classDetail.teacher.avatar,
                role: 'TEACHER'
              });
            }

            // Add students
            if (classDetail.students && Array.isArray(classDetail.students)) {
              classDetail.students.forEach((student: any) => {
                if (student.id !== this.currentUserId) {
                  uniqueUsers.set(student.id, {
                    id: student.id,
                    fullName: student.fullName || student.username,
                    avatar: student.avatar,
                    role: 'STUDENT'
                  });
                }
              });
            }
          });

          this.allUsers = Array.from(uniqueUsers.values());
          // ✅ Removed onSearchChange() - will be called only when user types
        }).catch(err => {
          console.error('Failed to load classmates:', err);
          this.allUsers = [];
        });
      },
      error: (err) => {
        console.error('Failed to load student classes:', err);
        this.allUsers = [];
      }
    });
  }

  loadTeacherStudents() {
    // Get all classes where current user is teacher using getAllClasses
    this.classService.getAllClasses().subscribe({
      next: (classes: any[]) => {
        const teacherClasses = classes.filter(c => c.teacher?.id === this.currentUserId);

        if (teacherClasses.length === 0) {
          this.allUsers = [];
          return; // ✅ Removed onSearchChange()
        }

        const uniqueUsers = new Map<number, UserForChat>();

        teacherClasses.forEach(classItem => {
          // Add students from this class
          if (classItem.students && Array.isArray(classItem.students)) {
            classItem.students.forEach((student: any) => {
              uniqueUsers.set(student.id, {
                id: student.id,
                fullName: student.fullName || student.username,
                avatar: student.avatar,
                role: 'STUDENT'
              });
            });
          }
        });

        this.allUsers = Array.from(uniqueUsers.values());
        // ✅ Removed onSearchChange()
      },
      error: (err) => {
        console.error('Failed to load teacher classes:', err);
        this.allUsers = [];
      }
    });
  }

  loadAllUsersNoFilter() {
    // Fallback: Load all users (for admin or other roles)
    this.userService.getUsers().subscribe({
      next: (users: any[]) => {
        this.allUsers = users
          .filter(u => u.id !== this.currentUserId)
          .map(u => ({
            id: u.id,
            fullName: u.fullName || u.username || 'User',
            avatar: u.avatar,
            role: u.role || 'USER'
          }));
        // ✅ Removed onSearchChange()
      },
      error: (err) => {
        console.error('Failed to load users:', err);
        this.allUsers = [];
      }
    });
  }

  startConversationWithUser(user: UserForChat) {
    // Create a temporary conversation
    const newConversation: Conversation = {
      conversationId: this.chatService.getConversationId(this.currentUserId, user.id),
      otherUserId: user.id,
      otherUserFullName: user.fullName,
      otherUserAvatar: user.avatar,
      unreadCount: 0
    };

    // Clear search
    this.searchText = '';
    this.searchResults = [];

    // Check if conversation already exists
    const existing = this.conversations.find(c => c.otherUserId === user.id);
    if (existing) {
      this.selectConversation(existing);
    } else {
      // Add to conversations list
      this.conversations.unshift(newConversation);
      this.selectConversation(newConversation);
    }
  }
}
