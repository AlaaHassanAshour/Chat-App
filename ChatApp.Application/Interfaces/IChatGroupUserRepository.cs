using ChatApp.Application.Models;

namespace ChatApp.Application.Interfaces;

public interface IChatGroupUserRepository
{
    Task AddRangeAsync(List<ChatGroupUser> members);
    Task<List<ChatGroupUser>> GetByUserIdAsync(string userId);
    Task<List<ChatGroupUser>> GetByGroupIdAsync(int groupId);
    Task RemoveUserFromGroupAsync(string userId, int groupId);
    Task SaveChangesAsync();
    Task<bool> IsUserInGroupAsync(string userId, int groupId);
}
