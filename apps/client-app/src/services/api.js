import { apiCommon } from "../utils/axiosInstance";
export const login = async (username, password) => {
  const response = await apiCommon.post("/Auth/login", {
    email: username.trim(),
    password,
  });

  return response;
};
export const getAllUsers = async () => {
  const response = await apiCommon.get("/Auth/AllUsers");
console.log("🚀 ~ getAllUsers ~ response:", response);
  return response;
};
export const getGroups = async () => {
  const res = await apiCommon.get("https://localhost:7152/api/Message/groubs");
  return res;
};
export const getGroupsUser = async () => {
  const res = await apiCommon.get("https://localhost:7152/api/Message/groupsUser");
  return res;
};
export const getMassegesGroups = async (groupId) => {
 const res = await apiCommon.get(`https://localhost:7152/api/message/group/${groupId}`, {
      });
    return res;
    }

export const getPrivateMessages = async (receiverId) => {
  const response = await apiCommon.get(`/message/private/${receiverId}`);
  return response;
};
export const sendMessages= async(content,receiverId,chatGroupId)=>{
  await apiCommon.post("https://localhost:7152/api/message/send", {
                          content,
                          receiverId,
                          chatGroupId
        });
}

export const createGroub = async (name ,memberIds) => {
 const res = await  apiCommon.post("https://localhost:7152/api/message/groups", {
     name,
    memberIds,
    });
    return res;
    };
export const createFolder = async (name, path) => {
  return await apiCommon.post(`/Folders/create`, null, {
    params: {
      name,
      path,
    },
  });
};

export const getFolderContents = async (path = "") => {
  return await apiCommon.get(`/Folders/browse`, {
    params: {
      path: path,
    },
  });
};

export const renameFolder = async (newName, path) => {
  return await apiCommon.put(`/Folders/rename`, null, {
    params: {
      name: newName,
      path: path,
    },
  });
};

export const renameFile = async (newName, path) => {
  return await apiCommon.put(`/Folders/renameFile`, null, {
    params: {
      name: newName,
      path: path,
    },
  });
};

export const deleteFolder = async (path) => {
  return await apiCommon.delete(`/Folders/delete`, {
    params: {
      path: path,
    },
  });
};

export const uploadImage = async (formData) => {
  return await apiCommon.post("/Upload/UploadImage", formData, {});
};
export const getImage = async (path) => {
  return await apiCommon.get("/Upload/getImage", {
    params: {
      imagePath: path,
    },
  });
};

export const deleteImage = async (path) => {
  return await apiCommon.delete("/Upload/DeleteImage", {
    params: {
      imagePath: path,
    },
  });
};
