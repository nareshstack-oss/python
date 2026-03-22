import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

const String apiBaseUrl = 'http://localhost:8090';

void main() {
  runApp(const ChatBoxIndiaApp());
}

class ChatBoxIndiaApp extends StatelessWidget {
  const ChatBoxIndiaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'ChatBoxIndia',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF145A57),
          brightness: Brightness.light,
        ),
        scaffoldBackgroundColor: const Color(0xFFF4ECDD),
      ),
      home: const LoginPage(),
    );
  }
}

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final emailController = TextEditingController(text: 'naresh@chatboxindia.app');
  final passwordController = TextEditingController(text: 'demo123');
  bool loading = false;
  String? errorText;

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  Future<void> login() async {
    setState(() {
      loading = true;
      errorText = null;
    });

    try {
      final response = await http.post(
        Uri.parse('$apiBaseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': emailController.text.trim(),
          'password': passwordController.text,
        }),
      );

      final data = jsonDecode(response.body);
      if (!mounted) {
        return;
      }

      if (response.statusCode >= 400) {
        setState(() {
          errorText = data['message']?.toString() ?? 'Login failed';
          loading = false;
        });
        return;
      }

      final session = Session(
        token: data['token'] as String,
        user: User.fromJson(data['user'] as Map<String, dynamic>),
      );

      Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(
          builder: (_) => ChatHomePage(session: session),
        ),
      );
    } catch (_) {
      setState(() {
        errorText = 'Could not reach the backend. Start ChatBoxIndia backend on port 8090.';
        loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 460),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Container(
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(34),
                color: const Color(0xFFFFFBF4),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x14000000),
                    blurRadius: 28,
                    offset: Offset(0, 16),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 58,
                        height: 58,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(18),
                          gradient: const LinearGradient(
                            colors: [Color(0xFF145A57), Color(0xFFD46B2A)],
                          ),
                        ),
                        child: const Center(
                          child: Text(
                            'CB',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w800,
                              fontSize: 20,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'ChatBoxIndia',
                              style: TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.w800,
                                letterSpacing: -0.6,
                              ),
                            ),
                            SizedBox(height: 4),
                            Text(
                              'Login to the premium chat MVP.',
                              style: TextStyle(
                                color: Color(0xFF70665D),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'Demo accounts',
                    style: TextStyle(
                      color: Color(0xFF8A7B6B),
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'naresh@chatboxindia.app / demo123\nananya@chatboxindia.app / demo123',
                    style: TextStyle(height: 1.5),
                  ),
                  const SizedBox(height: 22),
                  TextField(
                    controller: emailController,
                    decoration: const InputDecoration(
                      labelText: 'Email',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.all(Radius.circular(16)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: passwordController,
                    obscureText: true,
                    decoration: const InputDecoration(
                      labelText: 'Password',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.all(Radius.circular(16)),
                      ),
                    ),
                  ),
                  if (errorText != null) ...[
                    const SizedBox(height: 14),
                    Text(
                      errorText!,
                      style: const TextStyle(
                        color: Color(0xFFAA3C2E),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                  const SizedBox(height: 22),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: loading ? null : login,
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFF145A57),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(18),
                        ),
                      ),
                      child: Text(loading ? 'Signing in...' : 'Login'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class ChatHomePage extends StatefulWidget {
  final Session session;

  const ChatHomePage({super.key, required this.session});

  @override
  State<ChatHomePage> createState() => _ChatHomePageState();
}

class _ChatHomePageState extends State<ChatHomePage> {
  final api = ChatApi();
  bool loading = true;
  String? errorText;
  List<ChatSummary> chats = const [];
  List<User> users = const [];

  @override
  void initState() {
    super.initState();
    loadData();
  }

  Future<void> loadData() async {
    setState(() {
      loading = true;
      errorText = null;
    });

    try {
      final results = await Future.wait([
        api.fetchChats(widget.session.token),
        api.fetchUsers(),
      ]);
      if (!mounted) {
        return;
      }
      final allUsers = results[1] as List<User>;
      setState(() {
        chats = results[0] as List<ChatSummary>;
        users = allUsers.where((user) => user.id != widget.session.user.id).toList();
        loading = false;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        loading = false;
        errorText = 'Could not load chats. Make sure the backend is running on port 8090.';
      });
    }
  }

  Future<void> createNewChat() async {
    if (users.isEmpty) {
      return;
    }

    final selectedUser = await showModalBottomSheet<User>(
      context: context,
      backgroundColor: const Color(0xFFFFFBF4),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 22, 20, 30),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Start a new chat',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 16),
                for (final user in users)
                  ListTile(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                    leading: _AvatarBadge(user.avatar, color: avatarColor(user.avatar)),
                    title: Text(user.name),
                    subtitle: Text(user.about),
                    onTap: () => Navigator.pop(context, user),
                  ),
              ],
            ),
          ),
        );
      },
    );

    if (selectedUser == null || !mounted) {
      return;
    }

    final chat = await api.createChat(widget.session.token, selectedUser.id);
    await loadData();
    if (!mounted) {
      return;
    }
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => ChatDetailPage(
          session: widget.session,
          chat: chat,
        ),
      ),
    ).then((_) => loadData());
  }

  @override
  Widget build(BuildContext context) {
    final activeChats = chats.length;
    final unreadCount = chats.fold<int>(0, (sum, item) => sum + item.unreadCount);
    final onlineNow = users.where((user) => user.online).length;

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 54,
                        height: 54,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(18),
                          gradient: const LinearGradient(
                            colors: [Color(0xFF145A57), Color(0xFFD46B2A)],
                          ),
                        ),
                        child: const Center(
                          child: Text(
                            'CB',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w800,
                              fontSize: 18,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'ChatBoxIndia',
                              style: TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.w800,
                                letterSpacing: -0.7,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Welcome back, ${widget.session.user.name.split(' ').first}.',
                              style: const TextStyle(
                                color: Color(0xFF70665D),
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        onPressed: loadData,
                        icon: const Icon(Icons.refresh_rounded),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(28),
                      color: const Color(0xFFFFFBF4),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x14000000),
                          blurRadius: 26,
                          offset: Offset(0, 16),
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.all(18),
                    child: Row(
                      children: [
                        Expanded(
                          child: _StatCard(label: 'Active chats', value: '$activeChats'),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _StatCard(label: 'Unread', value: '$unreadCount'),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _StatCard(label: 'Online now', value: '$onlineNow'),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: Container(
                decoration: const BoxDecoration(
                  color: Color(0xFFFFFBF4),
                  borderRadius: BorderRadius.vertical(top: Radius.circular(36)),
                ),
                child: loading
                    ? const Center(child: CircularProgressIndicator())
                    : errorText != null
                        ? Center(
                            child: Padding(
                              padding: const EdgeInsets.all(24),
                              child: Text(
                                errorText!,
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  color: Color(0xFFAA3C2E),
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: loadData,
                            child: ListView.separated(
                              padding: const EdgeInsets.fromLTRB(18, 22, 18, 120),
                              itemCount: chats.length,
                              separatorBuilder: (_, __) => const SizedBox(height: 12),
                              itemBuilder: (context, index) {
                                final chat = chats[index];
                                final partner = chat.participants.first;
                                return Container(
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(26),
                                    color: const Color(0xFFF7F0E3),
                                    border: Border.all(color: const Color(0xFFEADBC7)),
                                  ),
                                  child: ListTile(
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                    leading: _AvatarBadge(partner.avatar, color: avatarColor(partner.avatar)),
                                    title: Text(
                                      partner.name,
                                      style: const TextStyle(fontWeight: FontWeight.w700),
                                    ),
                                    subtitle: Padding(
                                      padding: const EdgeInsets.only(top: 6),
                                      child: Text(
                                        chat.lastMessage?.text ?? 'No messages yet. Start the conversation.',
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(color: Color(0xFF6F665C), height: 1.4),
                                      ),
                                    ),
                                    trailing: Column(
                                      mainAxisSize: MainAxisSize.min,
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      crossAxisAlignment: CrossAxisAlignment.end,
                                      children: [
                                        Text(
                                          chat.lastMessage == null ? 'New' : displayTime(chat.lastMessage!.createdAt),
                                          style: const TextStyle(
                                            color: Color(0xFF7E7469),
                                            fontSize: 11,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                        const SizedBox(height: 6),
                                        if (chat.unreadCount > 0)
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                                            decoration: BoxDecoration(
                                              borderRadius: BorderRadius.circular(999),
                                              color: const Color(0xFF145A57),
                                            ),
                                            child: Text(
                                              '${chat.unreadCount}',
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontSize: 10,
                                                fontWeight: FontWeight.w800,
                                              ),
                                            ),
                                          ),
                                      ],
                                    ),
                                    onTap: () {
                                      Navigator.of(context)
                                          .push(
                                            MaterialPageRoute<void>(
                                              builder: (_) => ChatDetailPage(
                                                session: widget.session,
                                                chat: chat,
                                              ),
                                            ),
                                          )
                                          .then((_) => loadData());
                                    },
                                  ),
                                );
                              },
                            ),
                          ),
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: createNewChat,
        backgroundColor: const Color(0xFFD46B2A),
        foregroundColor: Colors.white,
        label: const Text('New Chat'),
        icon: const Icon(Icons.edit_rounded),
      ),
    );
  }
}

class ChatDetailPage extends StatefulWidget {
  final Session session;
  final ChatSummary chat;

  const ChatDetailPage({
    super.key,
    required this.session,
    required this.chat,
  });

  @override
  State<ChatDetailPage> createState() => _ChatDetailPageState();
}

class _ChatDetailPageState extends State<ChatDetailPage> {
  final api = ChatApi();
  final textController = TextEditingController();
  bool loading = true;
  bool sending = false;
  List<MessageItem> messages = const [];

  User get partner => widget.chat.participants.first;

  @override
  void initState() {
    super.initState();
    loadMessages();
  }

  @override
  void dispose() {
    textController.dispose();
    super.dispose();
  }

  Future<void> loadMessages() async {
    setState(() => loading = true);
    try {
      final fetched = await api.fetchMessages(widget.session.token, widget.chat.id);
      if (!mounted) {
        return;
      }
      setState(() {
        messages = fetched;
        loading = false;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() => loading = false);
    }
  }

  Future<void> sendMessage() async {
    final text = textController.text.trim();
    if (text.isEmpty) {
      return;
    }
    setState(() => sending = true);
    try {
      await api.sendMessage(widget.session.token, widget.chat.id, text);
      textController.clear();
      await loadMessages();
    } finally {
      if (mounted) {
        setState(() => sending = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFFFFFBF4),
        titleSpacing: 0,
        title: Row(
          children: [
            _AvatarBadge(partner.avatar, color: avatarColor(partner.avatar)),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(partner.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                Text(
                  partner.online ? 'Online now' : partner.about,
                  style: const TextStyle(fontSize: 12, color: Color(0xFF6F665C)),
                ),
              ],
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: loading
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 18, 16, 18),
                    reverse: true,
                    itemCount: messages.length,
                    itemBuilder: (context, index) {
                      final message = messages[messages.length - 1 - index];
                      final mine = message.senderId == widget.session.user.id;
                      return Align(
                        alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
                        child: Container(
                          constraints: const BoxConstraints(maxWidth: 420),
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.fromLTRB(14, 12, 14, 10),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(22),
                            color: mine ? const Color(0xFF145A57) : const Color(0xFFFFFBF4),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                message.text,
                                style: TextStyle(
                                  color: mine ? Colors.white : const Color(0xFF201A16),
                                  height: 1.45,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    displayTime(message.createdAt),
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: mine ? Colors.white70 : const Color(0xFF7D7369),
                                    ),
                                  ),
                                  if (mine) ...[
                                    const SizedBox(width: 8),
                                    Text(
                                      message.status,
                                      style: const TextStyle(fontSize: 11, color: Colors.white70),
                                    ),
                                  ],
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: textController,
                      decoration: InputDecoration(
                        hintText: 'Type a message',
                        filled: true,
                        fillColor: const Color(0xFFFFFBF4),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(22),
                          borderSide: BorderSide.none,
                        ),
                      ),
                      onSubmitted: (_) => sendMessage(),
                    ),
                  ),
                  const SizedBox(width: 10),
                  FloatingActionButton(
                    heroTag: 'sendButton',
                    onPressed: sending ? null : sendMessage,
                    backgroundColor: const Color(0xFFD46B2A),
                    foregroundColor: Colors.white,
                    child: const Icon(Icons.send_rounded),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;

  const _StatCard({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: const Color(0xFFFFF8EE),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: Color(0xFF7A7065),
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _AvatarBadge extends StatelessWidget {
  final String label;
  final Color color;

  const _AvatarBadge(this.label, {required this.color});

  @override
  Widget build(BuildContext context) {
    return CircleAvatar(
      radius: 24,
      backgroundColor: color,
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class ChatApi {
  Future<Session> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$apiBaseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode >= 400) {
      throw Exception(data['message'] ?? 'Login failed');
    }
    return Session(
      token: data['token'] as String,
      user: User.fromJson(data['user'] as Map<String, dynamic>),
    );
  }

  Future<List<User>> fetchUsers() async {
    final response = await http.get(Uri.parse('$apiBaseUrl/auth/users'));
    final data = jsonDecode(response.body) as List<dynamic>;
    return data.map((item) => User.fromJson(item as Map<String, dynamic>)).toList();
  }

  Future<List<ChatSummary>> fetchChats(String token) async {
    final response = await http.get(
      Uri.parse('$apiBaseUrl/chats'),
      headers: {'Authorization': 'Bearer $token'},
    );
    final data = jsonDecode(response.body) as List<dynamic>;
    return data.map((item) => ChatSummary.fromJson(item as Map<String, dynamic>)).toList();
  }

  Future<ChatSummary> createChat(String token, String participantId) async {
    final response = await http.post(
      Uri.parse('$apiBaseUrl/chats'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({'participantId': participantId}),
    );
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode >= 400) {
      throw Exception(data['message'] ?? 'Could not create chat');
    }
    return ChatSummary.fromJson(data);
  }

  Future<List<MessageItem>> fetchMessages(String token, String chatId) async {
    final response = await http.get(
      Uri.parse('$apiBaseUrl/chats/$chatId/messages'),
      headers: {'Authorization': 'Bearer $token'},
    );
    final data = jsonDecode(response.body) as List<dynamic>;
    return data.map((item) => MessageItem.fromJson(item as Map<String, dynamic>)).toList();
  }

  Future<void> sendMessage(String token, String chatId, String text) async {
    final response = await http.post(
      Uri.parse('$apiBaseUrl/chats/$chatId/messages'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({'text': text}),
    );
    if (response.statusCode >= 400) {
      throw Exception('Could not send message');
    }
  }
}

class Session {
  final String token;
  final User user;

  Session({required this.token, required this.user});
}

class User {
  final String id;
  final String name;
  final String email;
  final String avatar;
  final String about;
  final bool online;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.avatar,
    required this.about,
    required this.online,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      name: json['name'] as String,
      email: json['email'] as String? ?? '',
      avatar: json['avatar'] as String? ?? 'U',
      about: json['about'] as String? ?? '',
      online: json['online'] as bool? ?? false,
    );
  }
}

class MessageItem {
  final String id;
  final String senderId;
  final String text;
  final DateTime createdAt;
  final String status;

  MessageItem({
    required this.id,
    required this.senderId,
    required this.text,
    required this.createdAt,
    required this.status,
  });

  factory MessageItem.fromJson(Map<String, dynamic> json) {
    return MessageItem(
      id: json['id'] as String,
      senderId: json['senderId'] as String,
      text: json['text'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      status: json['status'] as String? ?? 'sent',
    );
  }
}

class ChatSummary {
  final String id;
  final List<User> participants;
  final MessageItem? lastMessage;
  final int unreadCount;

  ChatSummary({
    required this.id,
    required this.participants,
    required this.lastMessage,
    required this.unreadCount,
  });

  factory ChatSummary.fromJson(Map<String, dynamic> json) {
    return ChatSummary(
      id: json['id'] as String,
      participants: (json['participants'] as List<dynamic>)
          .map((item) => User.fromJson(item as Map<String, dynamic>))
          .toList(),
      lastMessage: json['lastMessage'] == null
          ? null
          : MessageItem.fromJson(json['lastMessage'] as Map<String, dynamic>),
      unreadCount: json['unreadCount'] as int? ?? 0,
    );
  }
}

String displayTime(DateTime timestamp) {
  final now = DateTime.now();
  if (now.year == timestamp.year && now.month == timestamp.month && now.day == timestamp.day) {
    final hour = timestamp.hour % 12 == 0 ? 12 : timestamp.hour % 12;
    final suffix = timestamp.hour >= 12 ? 'PM' : 'AM';
    final minute = timestamp.minute.toString().padLeft(2, '0');
    return '$hour:$minute $suffix';
  }
  return '${timestamp.day}/${timestamp.month}';
}

Color avatarColor(String seed) {
  const colors = [
    Color(0xFF0C6A62),
    Color(0xFFCB682C),
    Color(0xFF425F9C),
    Color(0xFF8747A4),
    Color(0xFF2E7D32),
  ];
  return colors[seed.codeUnitAt(0) % colors.length];
}
