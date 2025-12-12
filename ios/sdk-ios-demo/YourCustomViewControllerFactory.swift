import Foundation
import ChoicelyCore

class YourCustomViewControllerFactory: ChoicelyExternalViewControllerFactory {
    
    func createViewController(choicelyNavigationitem: ChoicelyNavigationItem?) -> ChoicelyController? {
        let yourCustomUrl = "choicely://special/custom"
        let internalUrl = choicelyNavigationitem?.internalUrl
        
        if internalUrl?.contains(yourCustomUrl) == true {
            return ChoicelyView { YourCustomView() }
        }
        
        return nil
    }
}
