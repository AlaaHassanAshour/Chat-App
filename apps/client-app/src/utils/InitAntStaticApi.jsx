import { notification as antNotification, Modal as antModal } from "antd";

let notification;
let modal;

const InitAntStaticApi = () => {
    const [apiNotification, contextHolderNotification] =
        antNotification.useNotification();
    const [apiModal, contextHolderModal] = antModal.useModal();
    notification = apiNotification;
    modal = apiModal;
    return (
        <>
            {contextHolderNotification} {contextHolderModal}
        </>
    );
};

export default InitAntStaticApi;
// eslint-disable-next-line react-refresh/only-export-components
export { notification, modal };
