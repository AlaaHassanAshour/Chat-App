using ChatApp.Application.Models;

namespace ChatApp.Application.Interfaces;

public interface IChatGroupRepository
{
    Task<ChatGroup> AddAsync(ChatGroup group);
    Task<ChatGroup> GetByIdAsync(int id);
    Task<List<ChatGroup>> GetAllAsync();
    Task RemoveAsync(ChatGroup group);
    Task SaveChangesAsync();
}
