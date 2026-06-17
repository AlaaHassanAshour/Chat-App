using ChatApp.Application.Interfaces;
using ChatApp.Application.Models;
using ChatApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Infrastructure.Repositories;

public class ChatGroupRepository : IChatGroupRepository
{
    private readonly ChatAppContext _context;
    public ChatGroupRepository(ChatAppContext context) => _context = context;

    public async Task<ChatGroup> AddAsync(ChatGroup group)
    {
        _context.ChatGroups.Add(group);
        await _context.SaveChangesAsync();
        return group;
    }

    public async Task<ChatGroup> GetByIdAsync(int id) => await _context.ChatGroups.FindAsync(id);

    public async Task<List<ChatGroup>> GetAllAsync() => await _context.ChatGroups.ToListAsync();

    public async Task RemoveAsync(ChatGroup group)
    {
        _context.ChatGroups.Remove(group);
        await _context.SaveChangesAsync();
    }

    public async Task SaveChangesAsync() => await _context.SaveChangesAsync();
}
