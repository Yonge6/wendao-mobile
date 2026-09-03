import SwiftUI
import WidgetKit

private struct WidgetChapter: Decodable {
    struct Copy: Decodable {
        let title: String
        let action: String
    }

    let id: Int
    let zh: Copy
    let en: Copy
}

private struct EncounterEntry: TimelineEntry {
    let date: Date
    let chapter: WidgetChapter
}

private enum EncounterData {
    static let chapters: [WidgetChapter] = {
        guard let url = Bundle.main.url(forResource: "chapters", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let chapters = try? JSONDecoder().decode([WidgetChapter].self, from: data),
              !chapters.isEmpty else {
            return [WidgetChapter(id: 1, zh: .init(title: "道，可道，非常道", action: "今日慢读一章。"), en: .init(title: "A way that can be spoken", action: "Read one chapter slowly today."))]
        }
        return chapters
    }()

    static func chapter(for date: Date) -> WidgetChapter {
        let calendar = Calendar.autoupdatingCurrent
        let components = calendar.dateComponents([.year, .month, .day], from: date)
        let key = String(format: "%04d-%02d-%02d", components.year ?? 1970, components.month ?? 1, components.day ?? 1)
        var hash: UInt32 = 0
        for scalar in key.unicodeScalars {
            hash = hash &* 31 &+ UInt32(scalar.value)
        }
        return chapters[Int(hash % UInt32(chapters.count))]
    }
}

private struct EncounterProvider: TimelineProvider {
    func placeholder(in context: Context) -> EncounterEntry {
        EncounterEntry(date: Date(), chapter: EncounterData.chapter(for: Date()))
    }

    func getSnapshot(in context: Context, completion: @escaping (EncounterEntry) -> Void) {
        completion(EncounterEntry(date: Date(), chapter: EncounterData.chapter(for: Date())))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<EncounterEntry>) -> Void) {
        let now = Date()
        let entry = EncounterEntry(date: now, chapter: EncounterData.chapter(for: now))
        let tomorrow = Calendar.autoupdatingCurrent.date(byAdding: .day, value: 1, to: Calendar.autoupdatingCurrent.startOfDay(for: now)) ?? now.addingTimeInterval(86_400)
        completion(Timeline(entries: [entry], policy: .after(tomorrow.addingTimeInterval(5))))
    }
}

private struct EncounterWidgetView: View {
    @Environment(\.widgetFamily) private var family
    @Environment(\.locale) private var locale

    let entry: EncounterEntry

    private var isChinese: Bool {
        locale.languageCode == "zh"
    }

    private var copy: WidgetChapter.Copy {
        isChinese ? entry.chapter.zh : entry.chapter.en
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .firstTextBaseline) {
                Text(isChinese ? "今日偶遇" : "TODAY’S ENCOUNTER")
                    .font(.system(size: 10, weight: .semibold))
                    .tracking(1.2)
                    .foregroundStyle(Color(red: 0.68, green: 0.50, blue: 0.17))
                Spacer(minLength: 6)
                Text(isChinese ? "第 \(entry.chapter.id) 章" : "CH. \(entry.chapter.id)")
                    .font(.system(size: 10, weight: .medium, design: .rounded))
                    .foregroundStyle(Color(red: 0.19, green: 0.35, blue: 0.40))
            }

            Text(copy.title)
                .font(.system(size: family == .systemSmall ? 20 : 23, weight: .semibold, design: .serif))
                .foregroundStyle(Color(red: 0.07, green: 0.25, blue: 0.29))
                .lineLimit(family == .systemSmall ? 3 : 2)
                .minimumScaleFactor(0.82)

            if family != .systemSmall {
                Text(copy.action)
                    .font(.system(size: 12))
                    .foregroundStyle(Color(red: 0.19, green: 0.35, blue: 0.40))
                    .lineLimit(2)
            }

            Spacer(minLength: 0)

            HStack(spacing: 7) {
                Circle()
                    .fill(Color(red: 0.68, green: 0.50, blue: 0.17))
                    .frame(width: 5, height: 5)
                Text("三慢问道 · WENDAO")
                    .font(.system(size: 9, weight: .medium))
                    .tracking(0.7)
                    .foregroundStyle(Color(red: 0.19, green: 0.35, blue: 0.40).opacity(0.78))
            }
        }
        .padding(16)
        .widgetURL(URL(string: "com.yonge6.wendao://chapter/\(entry.chapter.id)"))
        .wendaoWidgetBackground()
    }
}

private extension View {
    @ViewBuilder
    func wendaoWidgetBackground() -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            containerBackground(for: .widget) {
                Color(red: 0.97, green: 0.95, blue: 0.90)
            }
        } else {
            background(Color(red: 0.97, green: 0.95, blue: 0.90))
        }
    }
}

@main
struct WendaoWidget: Widget {
    let kind = "WendaoDailyEncounter"

    private var isChinese: Bool {
        Locale.current.languageCode == "zh"
    }

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: EncounterProvider()) { entry in
            EncounterWidgetView(entry: entry)
        }
        .configurationDisplayName(isChinese ? "今日偶遇" : "Today’s Encounter")
        .description(isChinese ? "每天从《道德经》遇见一章。" : "Meet one chapter of the Daodejing each day.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
