import { apiCommon } from "../utils/axiosInstance";
export const login = async (username, password) => {
  const response = await apiCommon.post("v1/Auth/login", {
    email: username.trim(),
    password,
  });

  return response;
};

export const refreshAuthToken = async (refreshToken) => {
  const response = await apiCommon.post("v1/Auth/refresh-token", {
    refreshToken,
  });

  return response;
};

export const revokeAuthToken = async (refreshToken) => {
  const response = await apiCommon.post("v1/Auth/revoke-token", {
    refreshToken,
  });

  return response;
};

export const register = async (email, password, mobile) => {
  const response = await apiCommon.post("v1/Auth/register", {
    email,
    password,
    mobile,
  });
  return response;
};

export const getNotifications = async () => {
  const response = await apiCommon.get("v1/Notification");
  return response;
};

export const markAllNotificationsAsRead = async () => {
  const response = await apiCommon.put("v1/Notification/read-all");
  return response;
};

export const markNotificationAsRead = async (id) => {
  const response = await apiCommon.put(`v1/Notification/${id}/read`);
  return response;
};

export const getAllUsers = async () => {
  const response = await apiCommon.get("v1/Auth/AllUsers");
console.log("🚀 ~ getAllUsers ~ response:", response);
  return response;
};

export const getOnlineUsers = async () => {
  const response = await apiCommon.get("v1/Auth/online-users");
  return response;
};
export const getGroups = async () => {
  const res = await apiCommon.get("v1/Message/groups");
  return res;
};
export const getGroupsUser = async () => {
  const res = await apiCommon.get("v1/Message/groupsUser");
  return res;
};
export const getMassegesGroups = async (groupId) => {
 const res = await apiCommon.get(`v1/Message/group/${groupId}`, {
      });
    return res;
    }

export const getPrivateMessages = async (receiverId) => {
  const response = await apiCommon.get(`v1/Message/private/${receiverId}`);
  return response;
};

export const markPrivateMessagesAsRead = async (senderId) => {
  const response = await apiCommon.put(`v1/Message/read/private/${senderId}`);
  return response;
};

export const markGroupMessagesAsRead = async (groupId) => {
  const response = await apiCommon.put(`v1/Message/read/group/${groupId}`);
  return response;
};

export const searchMessages = async (q, page = 1, pageSize = 20) => {
  const response = await apiCommon.get("v1/Message/search", {
    params: { q, Page: page, PageSize: pageSize },
  });
  return response;
};
export const sendMessages= async(content,receiverId,chatGroupId)=>{
  await apiCommon.post("v1/Message/send", {
                          content,
                          receiverId,
                          chatGroupId
        });
}

export const createGroub = async (name ,memberIds) => {
 const res = await  apiCommon.post("v1/Message/groups", {
     name,
    memberIds,
    });
    return res;
    };
export const createFolder = async (name, path) => {
  return await apiCommon.post(`Folders/create`, null, {
    params: {
      name,
      path,
    },
  });
};

export const getFolderContents = async (path = "") => {
  return await apiCommon.get(`Folders/browse`, {
    params: {
      path: path,
    },
  });
};

export const renameFolder = async (newName, path) => {
  return await apiCommon.put(`Folders/rename`, null, {
    params: {
      name: newName,
      path: path,
    },
  });
};

export const renameFile = async (newName, path) => {
  return await apiCommon.put(`Folders/renameFile`, null, {
    params: {
      name: newName,
      path: path,
    },
  });
};

export const deleteFolder = async (path) => {
  return await apiCommon.delete(`Folders/delete`, {
    params: {
      path: path,
    },
  });
};

export const uploadImage = async (formData) => {
  return await apiCommon.post("Upload/UploadImage", formData, {});
};
export const getImage = async (path) => {
  return await apiCommon.get("Upload/getImage", {
    params: {
      imagePath: path,
    },
  });
};

export const deleteImage = async (path) => {
  return await apiCommon.delete("Upload/DeleteImage", {
    params: {
      imagePath: path,
    },
  });
};
