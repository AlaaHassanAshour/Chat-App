using ChatApp.Application.Models;

namespace ChatApp.Application.Interfaces;

public interface IJwtService
{
    string GenerateToken(AppUser user);
    RefreshToken GenerateRefreshToken(string userId);
}
