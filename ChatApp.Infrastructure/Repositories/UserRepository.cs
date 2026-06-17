using ChatApp.Application.Interfaces;
using ChatApp.Application.Models;
using ChatApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly ChatAppContext _context;
    public UserRepository(ChatAppContext context) => _context = context;

    public async Task<AppUser> GetByIdAsync(string id) => await _context.Users.FindAsync(id);

    public async Task<AppUser> GetByEmailAsync(string email) => await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

    public async Task<List<AppUser>> GetAllAsync() => await _context.Users.ToListAsync();

    public async Task AddAsync(AppUser user)
    {
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
    }

    public async Task SaveChangesAsync() => await _context.SaveChangesAsync();
}
