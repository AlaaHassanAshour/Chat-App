using ChatApp.Application.Models;
using ChatApp.Infrastructure.Services;
using Microsoft.Extensions.Configuration;

namespace ChatApp.Tests;

public class JwtServiceTests
{
    private readonly JwtService _service;

    public JwtServiceTests()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string>
            {
                { "Jwt:Key", "THIS_IS_A_STRONG_SECRET_KEY_1234567890TestKey123" },
                { "Jwt:Issuer", "ChatApp" },
                { "Jwt:Audience", "ChatAppClient" }
            })
            .Build();

        _service = new JwtService(config);
    }

    [Fact]
    public void GenerateToken_ReturnsValidJwt()
    {
        var user = new AppUser { Id = "user1", Email = "test@test.com", UserName = "test@test.com" };

        var token = _service.GenerateToken(user);

        Assert.NotNull(token);
        Assert.NotEmpty(token);
        Assert.Contains(".", token);
    }

    [Fact]
    public void GenerateRefreshToken_ReturnsValidToken()
    {
        var refreshToken = _service.GenerateRefreshToken("user1");

        Assert.NotNull(refreshToken);
        Assert.NotEmpty(refreshToken.Token);
        Assert.Equal("user1", refreshToken.UserId);
        Assert.True(refreshToken.ExpiresAt > DateTime.UtcNow);
        Assert.False(refreshToken.IsRevoked);
        Assert.True(refreshToken.IsActive);
    }

    [Fact]
    public void GenerateRefreshToken_TwoTokens_AreDifferent()
    {
        var token1 = _service.GenerateRefreshToken("user1");
        var token2 = _service.GenerateRefreshToken("user1");

        Assert.NotEqual(token1.Token, token2.Token);
    }
}
