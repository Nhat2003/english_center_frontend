import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { ChatService, ChatMessage, Conversation } from '../../core/services/chat.service';
import { UserService } from '../../core/services/user.service';
import { ClassService } from '../../core/services/class.service';
import { StudentService } from '../../core/services/student.service';
import { TeacherService } from '../../core/services/teacher.service';
import { Subscription, forkJoin } from 'rxjs';

interface UserForChat {
  id: number;
  fullName: string;
  avatar?: string;
  role: string;
  className?: string; // Thêm tên lớp để hiển thị
}

interface ClassWithStudents {
  id: number;
  name: string;
  students: UserForChat[];
  teacherId?: number;
  isExpanded: boolean; // Để mở/đóng danh sách học sinh
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

  // Class-based view
  myClasses: ClassWithStudents[] = [];
  showClassView = false; // Toggle giữa danh sách cuộc hội thoại và danh sách lớp
  selectedClass: ClassWithStudents | null = null; // Lớp đang được chọn
  showClassMembers = false; // Hiển thị danh sách thành viên của lớp
  currentUserRole: string = '';

  messageText = '';
  conversations: Conversation[] = [];
  messages: ChatMessage[] = [];
  currentUserId: number = 0;

  private subscriptions: Subscription[] = [];
  private conversationSubscription: any = null;
  private processedMessageIds = new Set<number>(); // Track processed messages to avoid duplicates
  private searchTimeout: any;
  private baseUrl = 'http://localhost:8080';

  constructor(
    private chatService: ChatService,
    private userService: UserService,
    private classService: ClassService,
    private studentService: StudentService,
    private teacherService: TeacherService,
    private notification: NzNotificationService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    try {
      this.currentUserId = this.chatService.getCurrentUserId();

      // Chỉ kết nối WebSocket nếu đã đăng nhập (có userId hợp lệ)
      if (!this.currentUserId || this.currentUserId === 0) {
                return;
      }

      // Get current user role
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      this.currentUserRole = currentUser.role || '';

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

      // Load classes with students
      this.loadMyClasses();
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
        // Map backend data to frontend format
        this.conversations = data.map(conv => ({
          ...conv,
          otherUserFullName: conv.otherUserName || conv.otherUserFullName || 'Unknown',
          lastMessage: typeof conv.lastMessage === 'string'
            ? { content: conv.lastMessage, sentAt: conv.lastAt } as any
            : conv.lastMessage
        }));

        // Save to localStorage
        this.saveConversationsToCache();
      },
      error: (err) => {
        console.error('Failed to load conversations:', err);
        // Try to load from localStorage cache
        this.loadConversationsFromCache();
      }
    });
  }

  // Save conversations to localStorage
  private saveConversationsToCache() {
    try {
      localStorage.setItem('chatbox_conversations', JSON.stringify(this.conversations));
    } catch (e) {
          }
  }

  // Load conversations from localStorage
  private loadConversationsFromCache() {
    try {
      const cached = localStorage.getItem('chatbox_conversations');
      if (cached) {
        this.conversations = JSON.parse(cached);
      } else {
        this.conversations = [];
      }
    } catch (e) {
      this.conversations = [];
    }
  }

  loadChatHistory(otherUserId: number) {
    this.chatService.getChatHistory(otherUserId).subscribe({
      next: (data) => {
        this.messages = data.map(msg => ({
          ...msg,
          isOwn: msg.senderId === this.currentUserId
        }));

        // Mark all unread messages from other user as read
        const unreadMessages = data.filter(msg =>
          msg.senderId === otherUserId && !msg.isRead
        );

        if (unreadMessages.length > 0) {
          unreadMessages.forEach(msg => {
            this.chatService.markAsRead(msg.id).subscribe({
              error: (err) => console.error('Failed to mark as read:', err)
            });
          });

          // Reset unreadCount for current conversation after marking messages as read
          if (this.currentConversation) {
            const conv = this.conversations.find(c => c.otherUserId === otherUserId);
            if (conv) {
              conv.unreadCount = 0;
              this.saveConversationsToCache();
            }
          }
        }

        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (err) => {
        console.error('Failed to load chat history:', err);
        this.messages = [];
      }
    });
  }

  handleIncomingMessage(msg: ChatMessage) {
    // Check if already processed (deduplicate messages from multiple subscriptions)
    if (msg.id && this.processedMessageIds.has(msg.id)) {
      return;
    }

    // Mark as processed
    if (msg.id) {
      this.processedMessageIds.add(msg.id);

      // Clean up old IDs (keep last 100)
      if (this.processedMessageIds.size > 100) {
        const firstId = this.processedMessageIds.values().next().value;
        this.processedMessageIds.delete(firstId);
      }
    }

    // Add isOwn flag
    const message = {
      ...msg,
      isOwn: msg.senderId === this.currentUserId
    };

    // Get sender name for notification
    let senderName = 'Người dùng';

    // Update conversation list
    const convIndex = this.conversations.findIndex(
      c => c.otherUserId === (msg.senderId === this.currentUserId ? msg.receiverId : msg.senderId)
    );

        if (convIndex >= 0) {
      const conv = this.conversations[convIndex];
      conv.lastMessage = msg;
      senderName = conv.otherUserFullName || conv.otherUserName || senderName;

      // Increment unread if not current conversation and not own message
      // Also increment if chatbox is closed, even if it's the current conversation
      const shouldIncrementUnread = !message.isOwn && (
        !this.isOpen || // Chatbox is closed
        !this.currentConversation || // No current conversation
        conv.otherUserId !== this.currentConversation.otherUserId // Different conversation
      );

      if (shouldIncrementUnread) {
        conv.unreadCount++;
                console.log('📊 Total unread count:', this.getTotalUnreadCount());

        // Show notification for new message (not own message, not in current conversation)
        this.showMessageNotification(senderName, msg.content);
      } else {
              }

      // Move to top
      this.conversations.splice(convIndex, 1);
      this.conversations.unshift(conv);

      // Save to cache after updating
      this.saveConversationsToCache();
    } else if (!message.isOwn) {
      // New conversation from unknown user - need to create conversation
      const otherUserId = msg.senderId;

      // Try to find user info from allUsers list
      const userInfo = this.allUsers.find(u => u.id === otherUserId);

      if (userInfo) {
        senderName = userInfo.fullName;

        // Create new conversation
        const newConv: Conversation = {
          conversationId: this.chatService.getConversationId(this.currentUserId, otherUserId),
          otherUserId: otherUserId,
          otherUserFullName: userInfo.fullName,
          otherUserAvatar: userInfo.avatar,
          lastMessage: msg,
          unreadCount: 1
        };

        this.conversations.unshift(newConv);
        this.saveConversationsToCache();
      }

      // Show notification for new message
      this.showMessageNotification(senderName, msg.content);
    }

    // Add to messages if in current conversation
    if (this.currentConversation) {
      const isFromCurrentConv =
        (msg.senderId === this.currentConversation.otherUserId && msg.receiverId === this.currentUserId) ||
        (msg.receiverId === this.currentConversation.otherUserId && msg.senderId === this.currentUserId);

      if (isFromCurrentConv) {
        // If this is own message from server (with real DB ID), replace temporary message
        if (message.isOwn && msg.id) {
          // Find temporary message by content and timestamp (within last 10 seconds)
          const now = Date.now();
          const tempMsgIndex = this.messages.findIndex(
            m => m.isOwn &&
                 m.content === msg.content &&
                 m.id && m.id > 1000000000000 && // Is timestamp
                 (now - m.id < 10000) // Within last 10 seconds
          );

          if (tempMsgIndex >= 0) {
            // Replace temporary message with real message from DB
            this.messages[tempMsgIndex] = message;
          } else {
            // Check if this message already exists (by ID)
            const existingIndex = this.messages.findIndex(m => m.id === msg.id);
            if (existingIndex === -1) {
              this.messages.push(message);
            }
          }
        } else {
          // For received messages, check if already exists (avoid duplicates)
          const exists = this.messages.find(m => m.id === msg.id);
          if (!exists) {
            this.messages.push(message);
          }
        }

        setTimeout(() => this.scrollToBottom(), 100);

        // Mark as read if not own message
        if (!message.isOwn && msg.id) {
          this.chatService.markAsRead(msg.id).subscribe();
        }
      }
    }
  }

  // Show notification for new message
  showMessageNotification(senderName: string, content: string) {
    // Only show notification if chatbox is closed or minimized
    if (!this.isOpen || this.isMinimized) {
      const maxLength = 50;
      const truncatedContent = content.length > maxLength
        ? content.substring(0, maxLength) + '...'
        : content;

      this.notification.info(
        `Tin nhắn mới từ ${senderName}`,
        truncatedContent,
        {
          nzDuration: 4000
        }
      );

      // Play notification sound (optional)
      this.playNotificationSound();
    }
  }

  // Play notification sound
  playNotificationSound() {
    try {
      const audio = new Audio('assets/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (err) {
      // Silent fail
    }
  }

  toggleChatbox() {
    this.isOpen = !this.isOpen;
    if (!this.isOpen) {
      // Khi đóng chatbox, chỉ set isMinimized = false
      // Giữ nguyên tất cả state: currentConversation, messages, showConversationList
      this.isMinimized = false;
    } else {
      // Khi mở chatbox
      // Reload conversations để cập nhật unread count
      this.loadConversations();

      // Nếu có currentConversation, scroll xuống bottom
      if (this.currentConversation && !this.showConversationList) {
        setTimeout(() => this.scrollToBottom(), 100);
      }
    }
  }

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
  }

  selectConversation(conversation: Conversation) {
    // Nếu đang ở conversation này rồi, chỉ cần chuyển view và scroll
    if (this.currentConversation?.conversationId === conversation.conversationId) {
      this.showConversationList = false;
      setTimeout(() => this.scrollToBottom(), 100);
      return;
    }

    this.currentConversation = conversation;
    this.showConversationList = false;
    this.messages = [];

    // Load chat history
    this.loadChatHistory(conversation.otherUserId);

    // Unsubscribe from previous conversation (if any)
    const convId = this.chatService.getConversationId(this.currentUserId, conversation.otherUserId);
    this.chatService.unsubscribeFromConversation(convId);

    // Subscribe to conversation topic
    this.chatService.subscribeToConversation(convId, (msg) => {
      this.handleIncomingMessage(msg);
    });
  }

  backToConversationList() {
    // Chỉ chuyển view về conversation list
    // Giữ nguyên currentConversation và messages để khi user click vào lại thì không mất
    this.showConversationList = true;
  }

  // Handle header click for navigation
  handleHeaderClick() {
    if (this.showClassMembers) {
      this.backToClassList();
    } else if (!this.showConversationList) {
      this.backToConversationList();
    }
  }

  // Get dynamic header title
  getHeaderTitle(): string {
    if (this.showClassMembers && this.selectedClass) {
      return this.selectedClass.name;
    }
    if (!this.showConversationList && this.currentConversation) {
      return this.currentConversation.otherUserFullName;
    }
    if (this.showClassView) {
      return 'Lớp học';
    }
    return 'Tin nhắn';
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
    if (!date) return '';

    const now = new Date();
    const msgDate = typeof date === 'string' ? new Date(date) : date;

    // Check if date is valid
    if (isNaN(msgDate.getTime())) return '';

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

  getLastMessageContent(lastMessage: any): string {
    if (!lastMessage) return '';
    if (typeof lastMessage === 'string') return lastMessage;
    return lastMessage.content || '';
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

    // Debounce search
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      const searchTerm = this.searchText.toLowerCase();
      console.log('🔍 Searching:', searchTerm);

      // If in class view, search within classes
      if (this.showClassView) {
        // Search in all students from all classes
        const allStudentsFromClasses: UserForChat[] = [];
        this.myClasses.forEach(classItem => {
          classItem.students.forEach(student => {
            // Add class name to student for display
            allStudentsFromClasses.push({
              ...student,
              className: classItem.name
            });
          });
        });

        // Filter by name or class name
        this.searchResults = allStudentsFromClasses.filter(student =>
          student.fullName.toLowerCase().includes(searchTerm) ||
          (student.className && student.className.toLowerCase().includes(searchTerm))
        );
      } else {
        // For ADMIN: use /users/search API for dynamic search
        // For others: search in allUsers (contacts)
        if (this.currentUserRole === 'ADMIN') {
          this.searchUsersFromAPI(searchTerm);
        } else {
          // Regular user search for conversation view
          this.searchResults = this.allUsers.filter(user =>
            user.fullName.toLowerCase().includes(searchTerm) &&
            user.id !== this.currentUserId // Exclude current user
          );
        }
      }
    }, 300); // Debounce 300ms
  }

  searchUsersFromAPI(query: string) {
    const url = `${this.baseUrl}/users/search?q=${encodeURIComponent(query)}`;

    this.http.get<any[]>(url).subscribe({
      next: (users) => {
        console.log('✅ Search results:', users);
        this.searchResults = users
          .filter(u => u.id !== this.currentUserId) // Exclude current user
          .map(u => ({
            id: u.id,
            fullName: u.fullName || u.username,
            role: u.role,
            avatar: u.avatar
          }));
      },
      error: (err) => {
        console.error('❌ Search error:', err);
        this.searchResults = [];
      }
    });
  }

  loadAllUsers(searchQuery?: string) {
    const url = searchQuery
      ? `${this.baseUrl}/users/search?q=${encodeURIComponent(searchQuery)}`
      : `${this.baseUrl}/chat/contacts`;

    this.http.get<any[]>(url).subscribe({
      next: (users) => {
        console.log('✅ Users loaded:', users);
        this.allUsers = users.map(u => ({
          id: u.id,
          fullName: u.fullName || u.username,
          avatar: u.avatar,
          role: u.role || 'USER'
        }));
      },
      error: (err) => {
        console.error('❌ Load users error:', err);
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
            // Save to cache
      this.saveConversationsToCache();

      this.selectConversation(newConversation);
    }
  }

  // Toggle between conversation list and class view
  toggleClassView() {
    this.showClassView = !this.showClassView;
    this.showClassMembers = false;
    this.selectedClass = null;
    if (this.showClassView && this.myClasses.length === 0) {
      this.loadMyClasses();
    }
  }

  // Select a class to view its members
  selectClass(classItem: ClassWithStudents) {
    this.selectedClass = classItem;
    this.showClassMembers = true;
  }

  // Back to class list from members view
  backToClassList() {
    this.showClassMembers = false;
    this.selectedClass = null;
  }

  // Load classes based on user role
  loadMyClasses() {
    if (this.currentUserRole === 'STUDENT') {
      this.loadStudentClasses();
    } else if (this.currentUserRole === 'TEACHER') {
      this.loadTeacherClasses();
    }
  }

  // Load classes for students
  loadStudentClasses() {
    this.studentService.getClassesByStudent(this.currentUserId).subscribe({
      next: (classes: any[]) => {
        if (!classes || classes.length === 0) {
          this.myClasses = [];
          return;
        }

        // First, get all teachers to map teacher names to IDs
        this.teacherService.getAllTeachers().subscribe({
          next: (teachers: any[]) => {

            // Create teacher name -> ID map
            const teacherMap = new Map<string, any>();
            teachers.forEach(t => {
              const fullName = t.fullName || t.username;
              if (fullName) {
                teacherMap.set(fullName, t);
              }
            });

            // Process each class and fetch student details
            const classPromises = classes.map(classItem => {
                            const members: UserForChat[] = [];
              const memberPromises: Promise<void>[] = [];

              // Add teacher if available
              if (classItem.teacherName) {
                const teacher = teacherMap.get(classItem.teacherName);
                if (teacher && teacher.id !== this.currentUserId) {
                  members.push({
                    id: teacher.id,
                    fullName: classItem.teacherName,
                    avatar: teacher.avatar,
                    role: 'TEACHER',
                    className: classItem.name
                  });
                } else if (!teacher) {
                                  }
              }

              // Fetch details for each student
              if (classItem.students && Array.isArray(classItem.students)) {
                classItem.students.forEach((studentId: number) => {
                  // Skip current user
                  if (studentId === this.currentUserId) {
                    return;
                  }

                  const promise = this.studentService.getStudent(studentId).toPromise()
                    .then((student: any) => {
                      members.push({
                        id: studentId,
                        fullName: student.fullName || student.username || `Student ${studentId}`,
                        avatar: student.avatar,
                        role: 'STUDENT',
                        className: classItem.name
                      });
                    })
                    .catch(err => {
                      console.error(`Failed to load student ${studentId}:`, err);
                      // Add student with limited info
                      members.push({
                        id: studentId,
                        fullName: `Student ${studentId}`,
                        avatar: undefined,
                        role: 'STUDENT',
                        className: classItem.name
                      });
                    });

                  memberPromises.push(promise);
                });
              }

              // Wait for all members to load
              return Promise.all(memberPromises).then(() => ({
                id: classItem.id,
                name: classItem.name,
                students: members,
                teacherId: teacherMap.get(classItem.teacherName)?.id,
                isExpanded: false
              }));
            });

            // Wait for all classes to be processed
            Promise.all(classPromises).then(processedClasses => {
              this.myClasses = processedClasses;
                          }).catch(err => {
              console.error('Failed to load class details:', err);
              this.myClasses = [];
            });
          },
          error: (err) => {
            console.error('Failed to load teachers:', err);
            // Process classes without teacher info
            this.processStudentClassesWithoutTeachers(classes);
          }
        });
      },
      error: (err) => {
        console.error('Failed to load student classes:', err);
        this.myClasses = [];
      }
    });
  }

  // Fallback method when teachers list is not available
  private processStudentClassesWithoutTeachers(classes: any[]) {
    const classPromises = classes.map(classItem => {
      const members: UserForChat[] = [];
      const memberPromises: Promise<void>[] = [];

      // Fetch details for each student
      if (classItem.students && Array.isArray(classItem.students)) {
        classItem.students.forEach((studentId: number) => {
          if (studentId === this.currentUserId) {
            return;
          }

          const promise = this.studentService.getStudent(studentId).toPromise()
            .then((student: any) => {
              members.push({
                id: studentId,
                fullName: student.fullName || student.username || `Student ${studentId}`,
                avatar: student.avatar,
                role: 'STUDENT',
                className: classItem.name
              });
            })
            .catch(err => {
              console.error(`Failed to load student ${studentId}:`, err);
            });

          memberPromises.push(promise);
        });
      }

      return Promise.all(memberPromises).then(() => ({
        id: classItem.id,
        name: classItem.name,
        students: members,
        teacherId: undefined,
        isExpanded: false
      }));
    });

    Promise.all(classPromises).then(processedClasses => {
      this.myClasses = processedClasses;
      console.log('✅ Student classes loaded (without teachers):', this.myClasses);
    }).catch(err => {
      console.error('Failed to load class details:', err);
      this.myClasses = [];
    });
  }

  // Load classes for teachers
  loadTeacherClasses() {
        this.classService.getClassesByTeacher(this.currentUserId).subscribe({
      next: (classes: any[]) => {
                if (!classes || classes.length === 0) {
          this.myClasses = [];
                    return;
        }

        // Process each class and fetch student details
        const classPromises = classes.map(classItem => {
                    // Fetch details for all students in this class
          const studentPromises: Promise<UserForChat>[] = [];

          if (classItem.students && Array.isArray(classItem.students)) {
            classItem.students.forEach((studentId: number) => {
              const promise = this.studentService.getStudent(studentId).toPromise()
                .then((student: any) => ({
                  id: studentId,
                  fullName: student.fullName || student.username || `Student ${studentId}`,
                  avatar: student.avatar,
                  role: 'STUDENT',
                  className: classItem.name
                }))
                .catch(err => {
                  console.error(`Failed to load student ${studentId}:`, err);
                  return {
                    id: studentId,
                    fullName: `Student ${studentId}`,
                    avatar: undefined,
                    role: 'STUDENT',
                    className: classItem.name
                  };
                });

              studentPromises.push(promise);
            });
          }

          // Wait for all students to load, then create ClassWithStudents object
          return Promise.all(studentPromises).then(students => ({
            id: classItem.id,
            name: classItem.name,
            students: students,
            teacherId: this.currentUserId,
            isExpanded: false
          }));
        });

        // Wait for all classes to be processed
        Promise.all(classPromises).then(processedClasses => {
          this.myClasses = processedClasses;
                  }).catch(err => {
          console.error('❌ Failed to process classes:', err);
          this.myClasses = [];
        });
      },
      error: (err) => {
        console.error('❌ Failed to load teacher classes:', err);
        console.error('Error status:', err.status);
        console.error('Error message:', err.message);
        this.myClasses = [];
      }
    });
  }

  // Alternative method to load teacher classes using paginated endpoint
  loadTeacherClassesAlternative() {
      }  // Toggle expand/collapse class student list
  toggleClassExpand(classItem: ClassWithStudents) {
    classItem.isExpanded = !classItem.isExpanded;
  }

  // Start conversation with student from class
  startConversationFromClass(user: UserForChat) {
    this.startConversationWithUser(user);
    this.showClassView = false; // Return to conversation view
    this.showClassMembers = false;
    this.selectedClass = null;
  }
}
