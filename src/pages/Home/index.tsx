import { ConfigBlock, ConnectError, ConnectState, Footer } from "@/components";
import { useIntl } from "umi";
import styles from "./index.less";

const HomePage = () => {
    const { formatMessage } = useIntl();

    return (
        <>
            <ConnectError />
            <div className={styles.homePage}>
                <ConnectState />
                <ConfigBlock />
            </div>
            <Footer url={`https://app.hubspot.com`}
                message={formatMessage({ id: "home.toCRM" })} />
        </>
    );
};

export default HomePage;
