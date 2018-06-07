package com.enonic.lib.cluster;

import com.enonic.xp.index.IndexService;
import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.script.bean.ScriptBean;

public class IsMasterBean
    implements ScriptBean
{
    private IndexService indexService;

    @Override
    public void initialize( final BeanContext context )
    {
        this.indexService = context.getService( IndexService.class ).get();
    }

    public boolean isMaster()
    {
        return this.indexService.isMaster();
    }

}
