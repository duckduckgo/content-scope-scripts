export function UserScripts () {
    const scripts = []
    return (
        <div>
            <div className="subheading">
                <ul className="subnav">
                    {scripts.map(res => {
                        return <li key={res.name}>
                            <a href="" className="subnav__link" data-active={res.active}>{res.name}</a>
                        </li>
                    })}
                </ul>
            </div>
            <div className="main">
                <pre><code>{JSON.stringify(scripts, null, 2)}</code></pre>
            </div>
        </div>
    )
}

export default UserScripts
