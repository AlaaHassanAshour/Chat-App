using ChatApp.Application.Models;

namespace ChatApp.Application.Interfaces;

public interface IUserRepository
{
    Task<AppUser> GetByIdAsync(string id);
    Task<AppUser> GetByEmailAsync(string email);
    Task<List<AppUser>> GetAllAsync();
    Task AddAsync(AppUser user);
    Task SaveChangesAsync();
}
