import ProfileDetail from '../../../../components/profileDetail';

export default async function Profile({params,} : {
    params: Promise<{slug: string}>;
})
{
    const {slug} = await params;
    return(
        <>
        <div className='m-8 p-8 border-solid border-6 border-[#00B4D8] rounded-2xl flex justify-center items-center flex-col'>
            <ProfileDetail slug = {slug}></ProfileDetail>
        </div>
            
        </>
    )
}

