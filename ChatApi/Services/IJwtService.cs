using ChatApi.Models;

namespace ChatApi.Services
{
    public interface IJwtService
    {
        string GenerateToken(AppUser user);
    }
}
