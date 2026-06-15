namespace ChatApp.Application.Events;

public interface ILocalEventDispatcher
{
    Task PublishAsync<TEvent>(TEvent localEvent, CancellationToken cancellationToken = default)
        where TEvent : ILocalEvent;
}
