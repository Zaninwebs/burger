import { Img } from '../components/Img'
import { owner, team } from '../data/content'

/** Editoriales Team-Layout: großer Auftritt des Inhabers, versetzte Porträts. */
export function Team() {
  return (
    <section id="team" className="team section" aria-labelledby="team-title">
      <div className="wrap">
        <div className="team__head">
          <p className="eyebrow">Das Team</p>
          <h2 id="team-title" className="h-xl" data-reveal="text">
            Menschen <em>mit Gespür.</em>
          </h2>
        </div>

        <article className="team__owner">
          <Img id={owner.image} className="team__owner-img" reveal parallax={0.12} sizes="(min-width: 900px) 40vw, 92vw" />
          <div className="team__owner-text">
            <p className="num">Inhaber</p>
            <h3 className="team__owner-name" data-reveal="text">
              Simyan <em>Chicho</em>
            </h3>
            <p className="team__role" data-reveal="fade">
              {owner.role}
            </p>
            <Img id="simyan-foehnen" className="team__owner-action" reveal sizes="(min-width: 900px) 20vw, 50vw" />
          </div>
        </article>

        <ul className="team__grid">
          {team.map((m, i) => (
            <li key={m.name} className={`member member--${i}`}>
              <figure>
                <div className="member__frame" data-tilt>
                  <Img id={m.image} reveal sizes="(min-width: 900px) 24vw, (min-width: 600px) 45vw, 88vw" />
                </div>
                <figcaption>
                  <span className="member__name">{m.name}</span>
                  <span className="member__role">{m.role}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>

        <figure className="team__group">
          <Img id="team-salon" reveal parallax={0.1} sizes="(min-width: 1200px) 80vw, 100vw" />
          <figcaption data-reveal="fade">Unser Team</figcaption>
        </figure>
      </div>
    </section>
  )
}
