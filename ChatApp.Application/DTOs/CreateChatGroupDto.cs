using System.ComponentModel.DataAnnotations;

namespace ChatApp.Application.DTOs;

public class CreateChatGroupDto
{
    [Required(ErrorMessage = "Group name is required")]
    public string Name { get; set; }

    [Required(ErrorMessage = "At least one member is required")]
    [MinLength(1, ErrorMessage = "At least one member is required")]
    public List<string> MemberIds { get; set; }
}
