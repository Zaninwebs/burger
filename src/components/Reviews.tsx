import type { CSSProperties } from "react";
import { reviews, googleRating, reviewLinks, type Review } from "../data/reviews";
import Icon from "./Icon";
import "./Reviews.css";

function Stars({ value, label }: { value: number; label?: string }) {
  return (
    <span className="stars" role="img" aria-label={label ?? `${value} von 5 Sternen`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className="stars__star" style={{ "--fill": `${Math.max(0, Math.min(1, value - n + 1)) * 100}%` } as CSSProperties}>
          <Icon name="star" filled />
        </span>
      ))}
    </span>
  );
}

function ReviewCard({ review, index }: { review: Review; index: number }) {
  return (
    <figure className="review" data-reveal style={{ "--reveal-delay": (index % 3) * 90 } as CSSProperties}>
      <Stars value={review.rating} />
      <blockquote className="review__text">
        <p>„{review.text}“</p>
      </blockquote>
      <figcaption className="review__meta">
        <span className="review__author">{review.author}</span>
        <span>
          {review.date} · {review.url ? (
            <a href={review.url} target="_blank" rel="noopener">
              {review.source}
            </a>
          ) : (
            review.source
          )}
        </span>
      </figcaption>
    </figure>
  );
}

export default function Reviews() {
  const hasReviews = reviews.length > 0;
  const fmt = (n: number) => n.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  return (
    <section id="bewertungen" className="section reviews" aria-labelledby="reviews-title">
      <div className="container">
        <header className="reviews__head">
          <div>
            <p className="eyebrow" data-index="03" data-reveal>
              Bewertungen
            </p>
            <h2 id="reviews-title" className="section-title" data-reveal>
              Was unsere <em>Gäste</em> sagen.
            </h2>
          </div>

          {googleRating && (
            <a className="reviews__score" href={reviewLinks.read} target="_blank" rel="noopener" data-reveal>
              <span className="reviews__score-value">{fmt(googleRating.value)}</span>
              <span className="reviews__score-meta">
                <Stars value={googleRating.value} label={`${fmt(googleRating.value)} von 5 Sternen`} />
                <span>{googleRating.count.toLocaleString("de-DE")} Google-Bewertungen</span>
              </span>
            </a>
          )}
        </header>

        {hasReviews && (
          <div className="reviews__grid">
            {reviews.map((r, idx) => (
              <ReviewCard review={r} index={idx} key={`${r.author}-${idx}`} />
            ))}
          </div>
        )}

        <div className={`reviews__cta${hasReviews ? " reviews__cta--compact" : ""}`} data-reveal>
          <span className="reviews__quote" aria-hidden="true">
            “
          </span>
          <div className="reviews__cta-copy">
            <p className="reviews__cta-title">
              {hasReviews ? "Alle Bewertungen auf Google." : "Echte Meinungen – direkt auf Google."}
            </p>
            <p className="reviews__cta-text">
              Lesen Sie, was Gäste über Rialto schreiben, oder teilen Sie Ihre eigene Erfahrung. Ihr Feedback hilft uns – und
              anderen Hungrigen in Witzhelden bei der Wahl.
            </p>
          </div>
          <div className="reviews__cta-actions">
            <a className="btn" href={reviewLinks.read} target="_blank" rel="noopener">
              Bewertungen lesen
              <Icon name="external" />
              <span className="sr-only"> (Google Maps, öffnet in neuem Tab)</span>
            </a>
            <a className="btn btn--ghost" href={reviewLinks.write} target="_blank" rel="noopener">
              <Icon name="star" />
              Bewertung schreiben
              <span className="sr-only"> (Google Maps, öffnet in neuem Tab)</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
