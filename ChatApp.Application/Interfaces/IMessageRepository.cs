using ChatApp.Application.Models;

namespace ChatApp.Application.Interfaces;

public interface IMessageRepository
{
    Task<Message> AddAsync(Message message);
    Task<Message> GetByIdAsync(int id);
    Task<List<Message>> GetPrivateMessagesAsync(string userId, string receiverId, int skip, int take);
    Task<int> GetPrivateMessagesCountAsync(string userId, string receiverId);
    Task<List<Message>> GetGroupMessagesAsync(int groupId, int skip, int take);
    Task<int> GetGroupMessagesCountAsync(int groupId);
    Task<List<Message>> SearchMessagesAsync(string userId, string query, int skip, int take);
    Task<int> SearchMessagesCountAsync(string userId, string query);
    Task<List<Message>> GetAllMessagesAsync(int skip, int take);
    Task<int> GetAllMessagesCountAsync();
    Task<List<Message>> GetUnreadPrivateMessagesAsync(string userId, string senderId);
    Task<List<Message>> GetUnreadGroupMessagesAsync(string userId, int groupId);
    Task SaveChangesAsync();
}
