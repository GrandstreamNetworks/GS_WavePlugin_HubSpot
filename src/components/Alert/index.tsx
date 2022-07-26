import React from 'react';
import { Image } from 'antd'
import { useIntl } from "umi";
import UNSUPPORTED from '@/asset/home/unsupported.png';
import styles from './index.less';

interface IndexPageProps {
    show: boolean
}

const IndexPage: React.FC<IndexPageProps> = ({ show }) => {
    const { formatMessage } = useIntl();
    return (
        <div className={styles.background} hidden={!show}>
            <div className={styles.body}>
                <Image src={UNSUPPORTED} preview={false} className={styles.image} />
                <p className={styles.content}>{formatMessage({ id: "error.version" })}</p>
            </div>
        </div>
    )
}

export default IndexPage;