using ChatApp.Application.Interfaces;
using ChatApp.Application.Models;
using ChatApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Infrastructure.Repositories;

public class ChatGroupUserRepository : IChatGroupUserRepository
{
    private readonly ChatAppContext _context;
    public ChatGroupUserRepository(ChatAppContext context) => _context = context;

    public async Task AddRangeAsync(List<ChatGroupUser> members)
    {
        _context.ChatGroupUsers.AddRange(members);
        await _context.SaveChangesAsync();
    }

    public async Task<List<ChatGroupUser>> GetByUserIdAsync(string userId)
        => await _context.ChatGroupUsers.Include(gm => gm.ChatGroup).Where(gm => gm.UserId == userId).ToListAsync();

    public async Task<List<ChatGroupUser>> GetByGroupIdAsync(int groupId)
        => await _context.ChatGroupUsers.Include(gm => gm.User).Where(gm => gm.ChatGroupId == groupId).ToListAsync();

    public async Task SaveChangesAsync() => await _context.SaveChangesAsync();
}
