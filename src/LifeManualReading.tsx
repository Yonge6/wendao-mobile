import { useMemo } from "react";
import {
  detailedReading,
  foundationalReading,
  type HumanDesignReadingChart,
  type ReadingLanguage,
} from "./humanDesignReading";

export default function LifeManualReading({ chart, language, detailed = false }: {
  chart: HumanDesignReadingChart;
  language: ReadingLanguage;
  detailed?: boolean;
}) {
  const sections = useMemo(
    () => detailed ? detailedReading(chart, language) : foundationalReading(chart, language),
    [chart, language, detailed],
  );

  if (detailed) {
    return (
      <div className="profile-detail-sections">
        {sections.map((section, index) => (
          <article key={section.title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h4>{section.title}</h4>
              <p>{section.body}</p>
            </div>
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className="foundational-reading">
      <span className="reading-kicker">{language === "zh" ? "基础解读" : "Foundational reading"}</span>
      {sections.map((section) => (
        <article key={section.title}>
          <h4>{section.title}</h4>
          <p>{section.body}</p>
        </article>
      ))}
    </div>
  );
}
