namespace ChatApp.Application.Events;

public interface ILocalEventHandler<in TEvent>
    where TEvent : ILocalEvent
{
    Task HandleAsync(TEvent localEvent, CancellationToken cancellationToken = default);
}
