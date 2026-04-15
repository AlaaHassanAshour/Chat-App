namespace ChatApp.API.Services;

public class UserConnectionManager
{
    private static readonly Dictionary<string, HashSet<string>> _userConnections = new();
    private static readonly object _lock = new();

    public void AddConnection(string userId, string connectionId)
    {
        lock (_lock)
        {
            if (!_userConnections.ContainsKey(userId))
                _userConnections[userId] = new HashSet<string>();

            _userConnections[userId].Add(connectionId);
        }
    }

    public void RemoveConnection(string userId, string connectionId)
    {
        lock (_lock)
        {
            if (_userConnections.ContainsKey(userId))
            {
                _userConnections[userId].Remove(connectionId);
                if (_userConnections[userId].Count == 0)
                    _userConnections.Remove(userId);
            }
        }
    }

    public bool IsOnline(string userId)
    {
        lock (_lock)
        {
            return _userConnections.ContainsKey(userId) && _userConnections[userId].Count > 0;
        }
    }

    public List<string> GetOnlineUserIds()
    {
        lock (_lock)
        {
            return _userConnections.Keys.ToList();
        }
    }
}
