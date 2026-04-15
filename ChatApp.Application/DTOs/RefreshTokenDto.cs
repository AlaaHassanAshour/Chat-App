using System.ComponentModel.DataAnnotations;

namespace ChatApp.Application.DTOs;

public class RefreshTokenDto
{
    [Required]
    public string RefreshToken { get; set; }
}
