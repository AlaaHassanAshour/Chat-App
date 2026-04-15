using System.ComponentModel.DataAnnotations;

namespace ChatApp.Application.DTOs;

public class SendMessageDto
{
    [Required(ErrorMessage = "Content is required")]
    public string Content { get; set; }
    public string? ReceiverId { get; set; }
    public int? ChatGroupId { get; set; }
}
