using ChatApp.Application.Interfaces;
using ChatApp.Application.Models;
using ChatApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Infrastructure.Repositories;

public class MessageRepository : IMessageRepository
{
    private readonly ChatAppContext _context;
    public MessageRepository(ChatAppContext context) => _context = context;

    public async Task<Message> AddAsync(Message message)
    {
        _context.Messages.Add(message);
        await _context.SaveChangesAsync();
        return message;
    }

    public async Task<Message> GetByIdAsync(int id) => await _context.Messages.FindAsync(id);

    public async Task<List<Message>> GetPrivateMessagesAsync(string userId, string receiverId, int skip, int take)
        => await _context.Messages
            .Include(m => m.Sender)
            .Where(m => (m.SenderId == userId && m.ReceiverId == receiverId) || (m.SenderId == receiverId && m.ReceiverId == userId))
            .OrderByDescending(m => m.Timestamp)
            .Skip(skip).Take(take).ToListAsync();

    public async Task<int> GetPrivateMessagesCountAsync(string userId, string receiverId)
        => await _context.Messages.CountAsync(m => (m.SenderId == userId && m.ReceiverId == receiverId) || (m.SenderId == receiverId && m.ReceiverId == userId));

    public async Task<List<Message>> GetGroupMessagesAsync(int groupId, int skip, int take)
        => await _context.Messages
            .Include(m => m.Sender)
            .Where(m => m.ChatGroupId == groupId)
            .OrderByDescending(m => m.Timestamp)
            .Skip(skip)
            .Take(take)
            .ToListAsync();

    public async Task<int> GetGroupMessagesCountAsync(int groupId)
        => await _context.Messages.CountAsync(m => m.ChatGroupId == groupId);

    public async Task<List<Message>> SearchMessagesAsync(string userId, string query, int skip, int take)
        => await _context.Messages
            .Include(m => m.Sender)
            .Where(m => (m.SenderId == userId || m.ReceiverId == userId) && m.Content.Contains(query))
            .OrderByDescending(m => m.Timestamp).Skip(skip).Take(take).ToListAsync();

    public async Task<int> SearchMessagesCountAsync(string userId, string query)
        => await _context.Messages.CountAsync(m => (m.SenderId == userId || m.ReceiverId == userId) && m.Content.Contains(query));

    public async Task<List<Message>> GetAllMessagesAsync(int skip, int take)
        => await _context.Messages
            .Include(m => m.Sender)
            .OrderByDescending(x => x.Timestamp)
            .Skip(skip)
            .Take(take)
            .ToListAsync();

    public async Task<int> GetAllMessagesCountAsync()
        => await _context.Messages.CountAsync();

    public async Task<List<Message>> GetUnreadPrivateMessagesAsync(string userId, string senderId)
        => await _context.Messages.Where(m => m.SenderId == senderId && m.ReceiverId == userId && !m.IsRead).ToListAsync();

    public async Task<List<Message>> GetUnreadGroupMessagesAsync(string userId, int groupId)
        => await _context.Messages.Where(m => m.ChatGroupId == groupId && m.SenderId != userId && !m.IsRead).ToListAsync();

    public async Task SaveChangesAsync() => await _context.SaveChangesAsync();
}
