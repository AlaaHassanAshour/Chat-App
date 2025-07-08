import * as signalR from "@microsoft/signalr";

const connection = new signalR.HubConnectionBuilder()
  .withUrl("https://localhost:7152/chatHub", {
      accessTokenFactory: () => localStorage.getItem("accessToken"),
  })
  .withAutomaticReconnect()
  .build();

export default connection;