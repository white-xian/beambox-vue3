<script lang="jsx">
  import { computed, defineComponent, toRef, unref } from 'vue';
  import { BasicMenu } from '@/components/Menu';
  import { SimpleMenu } from '@/components/SimpleMenu';
  import { AppLogo } from '@/components/Application';
  import expandedLogoImg from '@/assets/images/logo.png';
  import collapsedLogoImg from '@/assets/images/favicon.png';

  import { MenuModeEnum, MenuSplitTyeEnum } from '@/enums';

  import { useMenuSetting } from '@/hooks/setting/useMenuSetting';
  import { ScrollContainer } from '@/components/Container';

  import { useGo } from '@/hooks/web/usePage';
  import { useSplitMenu } from './useLayoutMenu';
  import { openWindow } from '@/utils';
  import { propTypes } from '@/utils/propTypes';
  import { isHttpUrl } from '@/utils/core/ObjectUtil';
  import { useRootSetting } from '@/hooks/setting/useRootSetting';
  import { useAppInject } from '@/hooks/web/useAppInject';
  import { useDesign } from '@/hooks/web/useDesign';

  export default defineComponent({
    name: 'LayoutMenu',
    props: {
      theme: propTypes.oneOf(['light', 'dark']),

      splitType: {
        type: Number,
        default: MenuSplitTyeEnum.NONE,
      },

      isHorizontal: propTypes.bool,
      // menu Mode
      menuMode: {
        type: [String],
        default: '',
      },
    },
    setup(props) {
      const go = useGo();

      const {
        getMenuMode,
        getMenuType,
        getMenuTheme,
        getCollapsed,
        getCollapsedShowTitle,
        getAccordion,
        getIsHorizontal,
        getIsSidebarType,
        getSplit,
      } = useMenuSetting();
      const { getShowLogo } = useRootSetting();

      const { prefixCls } = useDesign('layout-menu');

      const { menusRef } = useSplitMenu(toRef(props, 'splitType'));

      const { getIsMobile } = useAppInject();

      const getComputedMenuMode = computed(() =>
        unref(getIsMobile) ? MenuModeEnum.INLINE : props.menuMode || unref(getMenuMode),
      );

      const getComputedMenuTheme = computed(() => props.theme || unref(getMenuTheme));

      const getIsShowLogo = computed(() => unref(getShowLogo) && unref(getIsSidebarType));

      const getUseScroll = computed(() => {
        return (
          !unref(getIsHorizontal) &&
          (unref(getIsSidebarType) ||
            props.splitType === MenuSplitTyeEnum.LEFT ||
            props.splitType === MenuSplitTyeEnum.NONE)
        );
      });

      const getWrapperStyle = computed(() => {
        return {
          height: `calc(100% - ${unref(getIsShowLogo) ? '60px' : '0px'})`,
        };
      });

      const getLogoClass = computed(() => {
        return [
          `${prefixCls}-logo`,
          unref(getComputedMenuTheme),
          {
            [`${prefixCls}--mobile`]: unref(getIsMobile),
          },
        ];
      });

      const getLogoImgSrc = computed(() =>
        unref(getCollapsed) ? collapsedLogoImg : expandedLogoImg,
      );

      const getLogoImgStyle = computed(() => {
        return unref(getCollapsed)
          ? {
              width: '24px',
              height: '24px',
            }
          : {
              width: '134px',
              height: 'auto',
            };
      });

      const getCommonProps = computed(() => {
        const menus = unref(menusRef);
        return {
          menus,
          beforeClickFn: beforeMenuClickFn,
          items: menus,
          theme: unref(getComputedMenuTheme),
          accordion: unref(getAccordion),
          collapse: unref(getCollapsed),
          collapsedShowTitle: unref(getCollapsedShowTitle),
          onMenuClick: handleMenuClick,
        };
      });

      /**
       * click menu
       * @param menu
       */

      function handleMenuClick(path) {
        go(path);
      }

      /**
       * before click menu
       * @param menu
       */
      async function beforeMenuClickFn(path) {
        if (!isHttpUrl(path)) {
          return true;
        }
        openWindow(path);
        return false;
      }

      function renderHeader() {
        if (!unref(getIsShowLogo) && !unref(getIsMobile)) return null;

        return (
          <AppLogo
            showTitle={false}
            class={unref(getLogoClass)}
            theme={unref(getComputedMenuTheme)}
            imgSrc={unref(getLogoImgSrc)}
            imgStyle={unref(getLogoImgStyle)}
          />
        );
      }

      function renderMenu() {
        const { menus, ...menuProps } = unref(getCommonProps);
        // console.log(menus);
        if (!menus || !menus.length) return null;
        return !props.isHorizontal ? (
          <SimpleMenu {...menuProps} isSplitMenu={unref(getSplit)} items={menus} />
        ) : (
          <BasicMenu
            {...menuProps}
            isHorizontal={props.isHorizontal}
            type={unref(getMenuType)}
            showLogo={unref(getIsShowLogo)}
            mode={unref(getComputedMenuMode)}
            items={menus}
          />
        );
      }

      return () => {
        return (
          <>
            {renderHeader()}
            {unref(getUseScroll) ? (
              <ScrollContainer style={unref(getWrapperStyle)}>{() => renderMenu()}</ScrollContainer>
            ) : (
              renderMenu()
            )}
          </>
        );
      };
    },
  });
</script>
<style lang="less">
  @prefix-cls: ~'@{namespace}-layout-menu';
  @logo-prefix-cls: ~'@{namespace}-app-logo';

  .@{prefix-cls} {
    &-logo {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 60px;
      padding: 0;
      background-color: @sider-dark-bg-color;
      border-bottom: 1px solid rgb(255 255 255 / 8%);

      .@{logo-prefix-cls} {
        width: 100%;
        justify-content: center;
        padding-left: 0;
      }
    }

    &--mobile {
      .@{logo-prefix-cls} {
        &__title {
          opacity: 1;
        }
      }
    }

    &-logo.light {
      border-bottom-color: rgb(238 238 238);
    }
  }
</style>
