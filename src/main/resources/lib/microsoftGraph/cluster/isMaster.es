const isMasterBean = __.newBean('com.enonic.lib.cluster.IsMasterBean');

export default function isMaster() {
    return __.toNativeObject(isMasterBean.isMaster());
}
