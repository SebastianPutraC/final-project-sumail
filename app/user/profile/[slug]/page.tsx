import ProfileDetail from '../../../../components/profileDetail';
import Header from "@/components/Header";

export default async function Profile({params,} : {
    params: Promise<{slug: string}>;
})
{
    const {slug} = await params;
    return(
        <>
            <div>
                <Header></Header>
            </div>
            <div>
                <ProfileDetail slug = {slug}></ProfileDetail>
            </div>
        </>
    )
}

