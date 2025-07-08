
using Microsoft.AspNetCore.SignalR;

namespace ChatApi.Hubs;
public class ChatHub : Hub
{
    public async Task JoinGroup(string groupName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
    }

    public async Task LeaveGroup(string groupName)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
    }
    public override Task OnConnectedAsync()
    {
        Console.WriteLine(">> Connected: " +
            Context.ConnectionId + " UserId: " + Context.UserIdentifier);
        return base.OnConnectedAsync();
    }
}


